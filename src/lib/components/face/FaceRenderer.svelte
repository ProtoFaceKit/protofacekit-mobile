<script lang="ts">
    import { ExpressionType, type Face } from "$lib/types/data";
    import FaceExpressionRenderer from "./FaceExpressionRenderer.svelte";

    type Props = {
        face: Face;
    };

    const { face }: Props = $props();

    let expressionType = $state(ExpressionType.IDLE);

    const expression = $derived(face.expressions[expressionType]);
</script>

<div class="container">
    <div>
        {#if expression}
            <FaceExpressionRenderer {expression} />
        {/if}
    </div>

    <button onclick={() => (expressionType = ExpressionType.IDLE)}>Idle</button>
    <button onclick={() => (expressionType = ExpressionType.TALKING)}
        >Talking</button
    >
</div>

<style>
    .container {
        width: 100%;
        overflow: auto;
    }
</style>
