<script lang="ts">
    import {
        ExpressionType,
        type Face,
        type FaceExpression,
    } from "$lib/types/data";
    import { sleep } from "$lib/utils/timing";

    import FaceExpressionPreview from "./FaceExpressionPreview.svelte";
    import FaceRender3D from "./FaceRender3D.svelte";

    interface Props {
        face: Face;
    }

    const { face }: Props = $props();

    const expressions = [
        ExpressionType.IDLE,
        ExpressionType.TALKING,
        ExpressionType.TOUCHED,
    ];

    let expression: FaceExpression | undefined = $state(undefined);

    async function animate(face: Face, abort: AbortController) {
        const validExpressions = Object.keys(face.expressions)
            .map((value) => parseInt(value) as ExpressionType)
            .filter(
                (expressionType) =>
                    face.expressions[expressionType] &&
                    face.expressions[expressionType].frames.length > 0,
            );

        // Nothing to render
        if (validExpressions.length < 1) return;

        let expressionIndex = 0;

        while (!abort.signal.aborted) {
            const currentExpression =
                face.expressions[validExpressions[expressionIndex]]!;
            expression = currentExpression;

            // Sleep before moving to the next expression
            await sleep(1000, abort);

            // Move to the next expression
            expressionIndex++;

            if (expressionIndex === validExpressions.length) {
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

{#if expression}
    <FaceExpressionPreview {expression} />
{:else}
    <FaceRender3D pixels={[]} />
{/if}
