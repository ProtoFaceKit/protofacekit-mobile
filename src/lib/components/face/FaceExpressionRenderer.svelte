<script lang="ts">
    import type { Face, FaceExpression, FaceFrame } from "$lib/ble";
    import FaceFrameRenderer from "./FaceFrameRenderer.svelte";

    type Props = {
        expression: FaceExpression;
    };

    const { expression }: Props = $props();

    let frameIndex = $state(0);

    const frame = $derived(expression.frames[frameIndex]);

    const frameIndexes = $derived.by(() => {
        let indexes = [];
        for (let i = 0; i < expression.frames.length; i += 1) {
            indexes.push(i);
        }
        return indexes;
    });
</script>

<div>
    {#if frame}
        <FaceFrameRenderer {frame} />
    {/if}
</div>

{#each frameIndexes as index (index)}
    <button
        onclick={() => {
            frameIndex = index;
        }}
    >
        Frame {frameIndex + 1}
    </button>
{/each}
