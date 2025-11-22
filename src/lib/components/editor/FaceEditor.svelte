<script lang="ts">
    import {
        ALL_EXPRESSIONS,
        EXPRESSION_TYPE_NAME,
        ExpressionType,
        type Face,
        type FaceFrame,
    } from "$lib/types/data";
    import ExpressionEditor from "./ExpressionEditor.svelte";

    interface Props {
        face: Face;
        onChangeFace: (face: Face) => void;
    }

    const { face, onChangeFace }: Props = $props();

    let expressionType = $state(ExpressionType.IDLE);

    const expression = $derived(face.expressions[expressionType]);

    function onChangeExpression(value: ExpressionType) {
        expressionType = value;
    }

    function onChangeFrames(action: (frames: FaceFrame[]) => FaceFrame[]) {
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        const newFrames = action(currentFrames);

        onChangeFace({
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        });
    }
</script>

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

{#key expressionType}
    <ExpressionEditor {expression} {onChangeFrames} />
{/key}

<style>
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
</style>
