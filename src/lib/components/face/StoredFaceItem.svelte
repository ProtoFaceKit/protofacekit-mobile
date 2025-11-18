<script lang="ts">
    import { EXPRESSION_TYPE_NAME, ExpressionType } from "$lib/types/data";
    import type { StoredFace } from "$lib/types/faceStore";
    import FacePreview from "./FacePreview.svelte";
    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";

    export interface Props {
        item: StoredFace;

        onShow: VoidFunction;
    }

    const { item, onShow }: Props = $props();
</script>

<div class="item">
    <div class="preview">
        <FacePreview face={item.face} />
    </div>

    <div class="item--details">
        <div>
            <p class="item--name">{item.name}</p>

            <div class="expressions">
                {#each [ExpressionType.IDLE, ExpressionType.TALKING, ExpressionType.TOUCHED] as expression (expression)}
                    {@const totalFrames =
                        item.face.expressions[expression]?.frames?.length ?? 0}
                    <p class="expression">
                        {EXPRESSION_TYPE_NAME[expression]}
                        <span class="expression__frames">
                            {totalFrames} Frame{totalFrames != 1 ? "s" : ""}
                        </span>
                    </p>
                {/each}
            </div>
        </div>

        <div class="actions">
            <a class="btn btn--surface" href="faces/{item.id}/editor"> Edit </a>

            <button class="btn btn--surface" onclick={onShow}> Show </button>

            <a class="btn btn--primary" href="/faces/{item.id}/delete">
                <SolarTrashBin2BoldDuotone />
            </a>
        </div>
    </div>
</div>

<style>
    .item {
        display: flex;
        flex-flow: column;
        align-items: center;

        border-radius: 0.45rem;
        border: 1px solid transparent;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
        color: #ffffff;
        background-color: #111;
        border: 2px solid #222;
    }

    .expression__frames {
        font-size: 0.75rem;
        color: #999;
    }

    .item--details {
        display: flex;
        flex-flow: column;
        width: 100%;
        padding: 1rem;

        background-color: #222;
    }

    .item--name {
        margin-bottom: 0.5rem;
    }

    .expressions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .expression {
        padding: 0.5rem 1rem;
        padding: 0.5rem 1rem;
        background-color: #2a2a2a;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        color: #ccc;
    }

    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .actions > .btn {
        flex-shrink: 0;
        flex: auto;
    }

    .preview {
        width: 100%;
        height: 192px;
    }
</style>
