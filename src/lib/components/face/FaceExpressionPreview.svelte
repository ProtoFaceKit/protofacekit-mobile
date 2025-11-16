<script lang="ts">
    import { type FaceExpression, type FaceFrame } from "$lib/types/data";
    import FaceRender3D from "./FaceRender3D.svelte";
    import { sleep } from "$lib/utils/timing";

    interface Props {
        expression: FaceExpression;
    }

    const { expression }: Props = $props();

    let frame: FaceFrame | undefined = $state(undefined);

    async function animate(expression: FaceExpression, abort: AbortController) {
        let frameIndex = 0;

        if (expression.frames.length < 1) {
            // No frames to render
            return;
        }

        // Frame change loop
        while (!abort.signal.aborted) {
            const currentFrame = expression.frames[frameIndex];
            frame = currentFrame;
            await sleep(currentFrame.duration, abort);
            frameIndex++;

            // Moved to the next expression
            if (frameIndex === expression.frames.length) {
                break;
            }
        }
    }

    $effect(() => {
        const abort = new AbortController();

        animate(expression, abort)
            .then(() => {})
            .catch(() => {});

        return () => {
            abort.abort();
        };
    });
</script>

<FaceRender3D pixels={frame?.pixels ?? []} />
