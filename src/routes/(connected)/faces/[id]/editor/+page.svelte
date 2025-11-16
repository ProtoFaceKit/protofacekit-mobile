<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FaceExpressionPreview from "$lib/components/face/FaceExpressionPreview.svelte";
    import FacePreview from "$lib/components/face/FacePreview.svelte";
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { ExpressionType } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { toast } from "svelte-sonner";
    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";

    const context = faceContext.get();
    const storedFace = $derived(context.face);
    const face = $derived(storedFace.face);

    let expressionType = $state(ExpressionType.IDLE);

    const expression = $derived(face.expressions[expressionType]);
</script>

<div>
    <div class="heading">
        <div class="path">
            <p class="path--segment">Faces /</p>
            <h1 class="path--name">{storedFace.name}</h1>
        </div>

        <div class="actions">
            <a class="btn" href="/">Back</a>
        </div>
    </div>
</div>

<div class="expressions">
    <button
        class="btn btn--span btn--large"
        onclick={() => (expressionType = ExpressionType.IDLE)}
    >
        Idle
    </button>
    <button
        class="btn btn--span btn--large"
        onclick={() => (expressionType = ExpressionType.TALKING)}
    >
        Talking
    </button>
</div>

<div class="preview">
    {#if expression}
        <FaceExpressionPreview {expression} />
    {:else}
        <FaceRender3D pixels={[]} />
    {/if}
</div>

<style>
    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        overflow: hidden;
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
        gap: 1rem;
        flex-shrink: 0;
    }

    .preview {
        height: 192px;
        background: black;
        margin-top: 1rem;
    }

    .expressions {
        display: flex;
        gap: 1em;
        flex-flow: row;
    }
</style>
