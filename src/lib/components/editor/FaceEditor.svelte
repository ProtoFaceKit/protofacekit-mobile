<script lang="ts">
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import FrameEditor from "$lib/components/editor/FrameEditor.svelte";
    import FrameTimeline from "$lib/components/frame/FrameTimeline.svelte";
    import { FACE_PANEL_TOTAL_PIXELS } from "$lib/constants";
    import { stateWithInitial } from "$lib/helpers/stateWithInitial.svelte";
    import {
        ALL_EXPRESSIONS,
        EXPRESSION_TYPE_NAME,
        ExpressionType,
        type Face,
        type FaceExpression,
        type FaceFrame,
        type Pixel,
    } from "$lib/types/data";
    import { deepClone } from "$lib/utils/clone";
    import { sleep } from "$lib/utils/timing";

    interface Props {
        name: string;

        initialFace: Face;
        saving: boolean;

        onSave: (face: Face) => void;
    }

    const { name, initialFace, saving, onSave }: Props = $props();

    const face = stateWithInitial<Face>(() => deepClone(initialFace));

    let expressionType = $state(ExpressionType.IDLE);
    let frameIndex = $state(0);

    let running = $state(false);
    let editorFullscreen = $state(false);

    let abort: AbortController | undefined;

    const expression = $derived(face.current.expressions[expressionType]);
    const frame = $derived(expression?.frames[frameIndex]);

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

    function onPlay() {
        onPause();

        abort = new AbortController();
        running = true;

        if (expression) {
            animate(expression, abort)
                .then(() => {})
                .catch(() => {});
        }
    }

    function onPause() {
        abort?.abort();
        abort = undefined;
        running = false;
    }

    function onSelectFrame(index: number) {
        onPause();
        frameIndex = index;
    }

    function onChangeExpression(value: ExpressionType) {
        expressionType = value;
        frameIndex = 0;

        if (running) {
            onPlay();
        }
    }

    function onChangeFrames(action: (frames: FaceFrame[]) => FaceFrame[]) {
        const currentFace = face.current;
        const currentFrames =
            currentFace.expressions[expressionType]?.frames ?? [];
        const newFrames = action(currentFrames);

        face.current = {
            ...currentFace,
            expressions: {
                ...currentFace.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        };
    }

    function onAddFrame() {
        onChangeFrames((frames) => {
            const defaultPixelData: Pixel[] = Array.from(
                { length: FACE_PANEL_TOTAL_PIXELS },
                () => [0, 0, 0],
            );
            const newFrame: FaceFrame = {
                duration: 100,
                pixels: defaultPixelData,
            };
            const newFrames = [...frames];
            newFrames.splice(frameIndex + 1, 0, newFrame);
            return newFrames;
        });
    }

    function onChangeFrameDuration(index: number, duration: number) {
        onChangeFrames((frames) => {
            return frames.map((frame, otherIndex) => {
                if (otherIndex === index) {
                    return {
                        ...frame,
                        duration,
                    };
                }

                return frame;
            });
        });
    }

    function onDeleteFrame(index: number) {
        onChangeFrames((frames) => {
            return frames.filter((frame, otherIndex) => {
                return otherIndex !== index;
            });
        });
    }

    function onDuplicateFrame(index: number) {
        onChangeFrames((frames) => {
            const newFrames = [...frames];
            const existingFrame = newFrames[index];
            if (!existingFrame) return frames;

            newFrames.splice(index + 1, 0, deepClone(existingFrame));

            return newFrames;
        });
    }

    function onMoveFrame(fromIndex: number, toIndex: number) {
        onChangeFrames((frames) => {
            const newFrames = [...frames];
            const tempA = newFrames[fromIndex];
            const tempB = newFrames[toIndex];
            if (!tempA || !tempB) return frames;

            newFrames[fromIndex] = tempB;
            newFrames[toIndex] = tempA;

            // Swap current frame if we are moving it
            if (frameIndex === fromIndex) {
                frameIndex = toIndex;
            }

            return newFrames;
        });
    }

    function onChangePixels(index: number, pixels: Pixel[]) {
        onChangeFrames((frames) => {
            return frames.map((frame, otherIndex) => {
                if (otherIndex === index) {
                    return {
                        ...frame,
                        pixels,
                    };
                } else {
                    return frame;
                }
            });
        });
    }
</script>

<div class="container">
    <div>
        <div class="heading">
            <div class="path">
                <p class="path--segment">Faces /</p>
                <h1 class="path--name">{name}</h1>
            </div>

            <div class="actions">
                <button
                    class="btn btn--primary"
                    onclick={() => onSave(face.current)}
                    disabled={saving}
                >
                    Save
                </button>
                <a class="btn" href="/">Back</a>
            </div>
        </div>
    </div>

    <div class="expressions">
        {#each ALL_EXPRESSIONS as expression (expression)}
            <button
                class="expression"
                class:expression--active={expressionType === expression}
                onclick={() => onChangeExpression(expression)}
            >
                {EXPRESSION_TYPE_NAME[expression]}
            </button>
        {/each}
    </div>

    <div class="preview">
        <FaceRender3D pixels={frame?.pixels ?? []} />
    </div>

    <div class="timeline">
        <FrameTimeline
            frames={expression?.frames ?? []}
            activeFrameIndex={frameIndex}
            {onPlay}
            {onPause}
            {onMoveFrame}
            {onSelectFrame}
            {onAddFrame}
            {onChangeFrameDuration}
            {running}
        />
    </div>

    <div class="editor" class:editor--fullscreen={editorFullscreen && frame}>
        {#if running}
            <p class="frame-text">Stop the running animation to edit</p>
        {:else if frame}
            {#key `${expressionType}:${frameIndex}`}
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
            {/key}
        {:else}
            <p class="frame-text">Select a frame</p>
        {/if}
    </div>
</div>

<style>
    .frame-text {
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
        display: grid;
        grid-template-columns: repeat(3, 1fr);
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
