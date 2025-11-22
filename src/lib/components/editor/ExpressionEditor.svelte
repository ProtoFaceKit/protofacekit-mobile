<script lang="ts">
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import FrameEditor from "$lib/components/editor/FrameEditor.svelte";
    import FrameTimeline from "$lib/components/frame/FrameTimeline.svelte";
    import { FACE_PANEL_TOTAL_PIXELS } from "$lib/constants";
    import {
        type FaceExpression,
        type FaceFrame,
        type Pixel,
    } from "$lib/types/data";
    import { deepClone } from "$lib/utils/clone";
    import { sleep } from "$lib/utils/timing";
    import { onMount } from "svelte";
    import { createDefaultFramePixels } from "$lib/utils/image";

    interface Props {
        expression: FaceExpression | undefined;
        onChangeFrames: (action: (frames: FaceFrame[]) => FaceFrame[]) => void;
    }

    const { expression, onChangeFrames }: Props = $props();

    let frameIndex = $state(0);

    let running = $state(false);
    let editorFullscreen = $state(false);

    let abort: AbortController | undefined;

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

    function onAddFrame() {
        onChangeFrames((frames) => {
            const defaultPixelData = createDefaultFramePixels();
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

    // Stop animation on unmount
    onMount(() => {
        return () => {
            onPause();
        };
    });
</script>

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
        {#key `${frameIndex}`}
            <FrameEditor
                previousFrame={expression?.frames?.[frameIndex - 1]}
                {frame}
                onDelete={() => onDeleteFrame(frameIndex)}
                onDuplicate={() => onDuplicateFrame(frameIndex)}
                onToggleFullscreen={() =>
                    (editorFullscreen = !editorFullscreen)}
                onChangePixels={(pixels) => onChangePixels(frameIndex, pixels)}
            />
        {/key}
    {:else}
        <p class="frame-text">Select a frame</p>
    {/if}
</div>

<style>
    .frame-text {
        padding: 3rem;
        color: #fff;
        text-align: center;
    }

    .preview {
        height: 192px;
        background: black;
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
