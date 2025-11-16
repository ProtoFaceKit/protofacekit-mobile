<script lang="ts">
    import { EXPRESSION_TYPE_NAME, ExpressionType } from "$lib/types/data";
    import type { StoredFace } from "$lib/types/faceStore";
    import FacePreview from "./FacePreview.svelte";

    export interface Props {
        item: StoredFace;

        onShow: VoidFunction;
    }

    const { item, onShow }: Props = $props();

    const expressionTypes = $derived(
        Object.keys(item.face.expressions).map(
            (value) => parseInt(value) as ExpressionType,
        ),
    );
</script>

<div class="item">
    <div class="preview">
        <FacePreview face={item.face} />
    </div>

    <div class="item--details">
        <div>
            <p class="item--name">{item.name}</p>

            <div class="expressions">
                {#each expressionTypes as expression (expression)}
                    {@const totalFrames =
                        item.face.expressions[expression]!.frames.length}
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
            <a class="btn btn--span btn--surface" href="faces/{item.id}">
                Edit
            </a>
            <button class="btn btn--span btn--surface" onclick={onShow}>
                Show
            </button>
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
        background-color: #2a2a2a;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        color: #ccc;
    }

    .actions {
        display: flex;
        gap: 1rem;
    }

    .preview {
        width: 100%;
        height: 192px;
    }
</style>
