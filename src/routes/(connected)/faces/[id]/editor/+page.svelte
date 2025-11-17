<script lang="ts">
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import FrameEditor from "$lib/components/frame/FrameEditor.svelte";
    import FrameTimeline from "$lib/components/frame/FrameTimeline.svelte";
    import { FACE_PANEL_TOTAL_PIXELS } from "$lib/constants";
    import { editorContext } from "$lib/context/editorContext.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import {
        ExpressionType,
        type Face,
        type FaceExpression,
        type FaceFrame,
    } from "$lib/types/data";
    import { deepClone } from "$lib/utils/clone";
    import { toastErrorMessage } from "$lib/utils/error";
    import { sleep } from "$lib/utils/timing";
    import { watch } from "runed";
    import { toast } from "svelte-sonner";

    const faceStore = faceStoreContext.get();

    const context = faceContext.get();
    const storedFace = $derived(context.face);

    let editorFullscreen = $state(false);
    let face: Face = $state({ expressions: {} });

    // Update the local face state when the stored face changes
    watch(
        () => storedFace,
        (storedFace) => {
            face = deepClone(storedFace.face);
        },
    );

    editorContext.set({
        get face() {
            return face;
        },
        set face(value: Face) {
            face = value;
        },
    });

    let expressionType = $state(ExpressionType.IDLE);
    const expression = $derived(face.expressions[expressionType]);

    let frameIndex = $state(0);
    const frame = $derived(expression?.frames[frameIndex]);

    let userSelection = $state(false);
    let running = $state(false);
    let abort: AbortController | undefined;

    let saving = $state(false);

    async function animate(expression: FaceExpression, abort: AbortController) {
        if (expression.frames.length < 1) {
            // No frames to render
            return;
        }

        // Frame change loop
        while (!abort.signal.aborted) {
            const currentFrame = expression.frames[frameIndex];
            await sleep(currentFrame.duration, abort);

            if (frameIndex + 1 === expression.frames.length) {
                // Restart the expression
                frameIndex = 0;
            } else {
                // Moved to the next frame
                frameIndex++;
            }
        }
    }

    function onStart() {
        userSelection = false;

        abort?.abort();

        abort = new AbortController();
        running = true;

        if (expression) {
            animate(expression, abort)
                .then(() => {})
                .catch(() => {});
        }
    }

    function onStop() {
        abort?.abort();
        abort = undefined;
        running = false;
        userSelection = true;
    }

    watch(
        () => expression,
        () => {
            // User selection overrides automatic playing
            if (userSelection) return;

            onStart();

            return () => {
                onStop();
            };
        },
    );

    function onAddFrame() {
        const defaultPixelData: [number, number, number][] = Array.from(
            { length: FACE_PANEL_TOTAL_PIXELS },
            () => [0, 0, 0],
        );
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        const newFrame: FaceFrame = { duration: 100, pixels: defaultPixelData };
        const newFrames = [...currentFrames];
        newFrames.splice(frameIndex + 1, 0, newFrame);
        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        };
    }

    function onChangeFrameDuration(index: number, duration: number) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: currentFrames.map((frame, otherIndex) => {
                        if (otherIndex === index) {
                            return {
                                ...frame,
                                duration,
                            };
                        } else {
                            return frame;
                        }
                    }),
                },
            },
        };
    }

    function onSelectFrame(index: number) {
        onStop();
        userSelection = true;
        frameIndex = index;
    }

    function onDeleteFrame(index: number) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: currentFrames.filter((frame, otherIndex) => {
                        return otherIndex !== index;
                    }),
                },
            },
        };
    }

    function onDuplicateFrame(index: number) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        const newFrames = [...currentFrames];
        const existingFrame = newFrames[index];
        if (!existingFrame) return;

        newFrames.splice(index + 1, 0, deepClone(existingFrame));

        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        };
    }

    function onMoveFrame(fromIndex: number, toIndex: number) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        const newFrames = [...currentFrames];

        const tempA = newFrames[fromIndex];
        const tempB = newFrames[toIndex];
        if (!tempA || !tempB) return;

        newFrames[fromIndex] = tempB;
        newFrames[toIndex] = tempA;

        // Swap current frame if we are moving it
        if (frameIndex === fromIndex) {
            frameIndex = toIndex;
        }

        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        };
    }

    function onChangePixels(index: number, pixels: [number, number, number][]) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: currentFrames.map((frame, otherIndex) => {
                        if (otherIndex === index) {
                            return {
                                ...frame,
                                pixels,
                            };
                        } else {
                            return frame;
                        }
                    }),
                },
            },
        };
    }

    async function onSave() {
        saving = true;

        const savePromise = faceStore.updateFace({
            ...storedFace,
            face,
        });
        toast.promise(savePromise, {
            loading: "Saving face..",
            success: "Saved face!",
            error: toastErrorMessage("Failed to save face"),
        });

        try {
            await savePromise;

            faceStore.appendFace;
        } catch (_err) {
            // toast.promise catches this
        } finally {
            saving = false;
        }
    }
</script>

<div class="container">
    <div>
        <div class="heading">
            <div class="path">
                <p class="path--segment">Faces /</p>
                <h1 class="path--name">{storedFace.name}</h1>
            </div>

            <div class="actions">
                <button class="btn" onclick={onSave} disabled={saving}>
                    Save
                </button>
                <a class="btn" href="/">Back</a>
            </div>
        </div>
    </div>

    <div class="expressions">
        <button
            class="expression"
            class:expression--active={expressionType === ExpressionType.IDLE}
            onclick={() => (expressionType = ExpressionType.IDLE)}
        >
            Idle
        </button>
        <button
            class="expression"
            class:expression--active={expressionType === ExpressionType.TALKING}
            onclick={() => (expressionType = ExpressionType.TALKING)}
        >
            Talking
        </button>
    </div>

    <div class="preview">
        <FaceRender3D pixels={frame?.pixels ?? []} />
    </div>

    <div class="timeline">
        <FrameTimeline
            frames={expression?.frames ?? []}
            activeFrameIndex={frameIndex}
            onPlay={onStart}
            onPause={onStop}
            {onMoveFrame}
            {onSelectFrame}
            {onAddFrame}
            {onChangeFrameDuration}
            {running}
        />
    </div>

    {#if running}
        <div class="running">
            <p>Pause the current animation to edit a frame</p>
        </div>
    {:else}
        <div
            class="editor"
            class:editor--fullscreen={editorFullscreen && frame}
        >
            {#if frame}
                <FrameEditor
                    previousFrame={expression?.frames?.[frameIndex - 1]}
                    {frame}
                    onDelete={() => onDeleteFrame(frameIndex)}
                    onDuplicate={() => onDuplicateFrame(frameIndex)}
                    onToggleFullscreen={() =>
                        (editorFullscreen = !editorFullscreen)}
                    onChangePixels={(pixels) =>
                        onChangePixels(frameIndex, pixels)}
                />
            {:else}
                <p class="select-frame">Select a frame</p>
            {/if}
        </div>
    {/if}
</div>

<style>
    .running {
        padding: 1rem;
        color: #999;
    }

    .select-frame {
        padding: 3rem;
        color: #fff;
        text-align: center;
    }

    .container {
        display: flex;
        flex-flow: column;
        height: 100%;
        overflow: hidden;
    }

    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        margin-bottom: 0.5rem;
        padding: 0 0.5rem;
    }

    .path {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;
        align-items: center;
        flex: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 0.5rem;
    }

    .path--name {
        color: #fff;
        font-size: 1.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .path--segment {
        color: #999;
        font-size: 1.25rem;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .preview {
        height: 192px;
        background: black;
    }

    .expressions {
        display: flex;
        flex-flow: row;
    }

    .expression {
        flex: auto;
        border: none;
        background-color: #222;
        color: #fff;
        padding: 0.5rem;
    }

    .expression--active {
        background-color: #333;
    }

    .editor {
        flex: auto;
        background-color: #000;
        background-image:
            linear-gradient(#222 1px, transparent 1px),
            linear-gradient(90deg, #222 1px, transparent 1px);
        background-size: 40px 40px; /* size of the grid squares */
        background-size:
            40px 40px,
            40px 40px,
            200px 200px,
            200px 200px;
        touch-action: none;
    }

    .editor--fullscreen {
        position: absolute;
        left: 0;
        top: env(safe-area-inset-top);
        width: 100%;
        height: calc(
            100% - env(safe-area-inset-top) - env(safe-area-inset-bottom)
        );
        z-index: 999;
    }
</style>
