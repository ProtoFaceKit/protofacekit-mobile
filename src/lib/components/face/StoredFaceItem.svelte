<script lang="ts">
    import { EXPRESSION_TYPE_NAME, ExpressionType } from "$lib/types/data";
    import type { StoredFace } from "$lib/types/face";
    import FacePreview from "./FacePreview.svelte";

    export interface Props {
        item: StoredFace;

        onEdit?: VoidFunction;
        onShow: VoidFunction;
    }

    const { item, onShow, onEdit }: Props = $props();

    const expressions = Object.keys(item.face.expressions)
        .map(
            (expressionKey) =>
                EXPRESSION_TYPE_NAME[expressionKey as any as ExpressionType],
        )
        .filter((value) => value !== undefined);
</script>

<div>
    <div class="preview">
        <FacePreview face={item.face} />
    </div>

    <div>
        {item.name}

        <div>
            {#each expressions as expression (expression)}
                <span>{expression}</span>
            {/each}
        </div>
    </div>

    <div>
        <button onclick={onEdit}>Edit</button>
        <button onclick={onShow}>Show</button>
    </div>
</div>

<style>
    .preview {
        width: 128px;
        height: 128px;
    }
</style>
