<script lang="ts">
    import { ExpressionType, type Face, type FaceFrame } from "$lib/types/data";
    import FaceFrameRenderer from "./FaceFrameRenderer.svelte";
    import FaceRender3D from "./FaceRender3D.svelte";

    interface Props {
        face: Face;
    }

    const { face }: Props = $props();

    const expressions = [ExpressionType.IDLE, ExpressionType.TALKING];

    let frame: FaceFrame | undefined = $state(undefined);

    function sleep(duration: number, abort: AbortController) {
        return new Promise((resolve, reject) => {
            let resolved = false;

            const timeoutHandle = setTimeout(() => {
                resolved = true;
                resolve(undefined);
            }, duration);

            abort.signal.addEventListener("abort", () => {
                if (resolved) return;
                clearTimeout(timeoutHandle);
                reject();
            });
        });
    }

    async function animate(face: Face, abort: AbortController) {
        const validExpressions = Object.keys(face.expressions).map(
            (value) => parseInt(value) as ExpressionType,
        );

        // Nothing to render
        if (validExpressions.length < 1) return;

        let expressionIndex = 0;

        while (!abort.signal.aborted) {
            const currentExpression =
                face.expressions[validExpressions[expressionIndex]]!;

            console.log(currentExpression);

            let frameIndex = 0;

            if (currentExpression.frames.length > 0) {
                // Frame change loop
                while (!abort.signal.aborted) {
                    const currentFrame = currentExpression.frames[frameIndex];
                    frame = currentFrame;
                    await sleep(currentFrame.duration, abort);
                    frameIndex++;

                    // Moved to the next expression
                    if (frameIndex === currentExpression.frames.length) {
                        break;
                    }
                }
            }

            // Sleep before moving to the next frame
            await sleep(1000, abort);

            // Move to the next expression
            expressionIndex++;

            if (expressionIndex === expressions.length) {
                expressionIndex = 0;
            }
        }
    }

    $effect(() => {
        const abort = new AbortController();

        animate(face, abort)
            .then(() => {})
            .catch(() => {});

        return () => {
            abort.abort();
        };
    });
</script>

{#if frame}
    <FaceRender3D {frame} />
{/if}
