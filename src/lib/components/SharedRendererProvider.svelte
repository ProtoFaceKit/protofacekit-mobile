<script lang="ts">
    import { rendererContext } from "$lib/context/rendererContext.svelte";
    import { createSharedRenderer } from "$lib/render/sharedRenderer";
    import type { Snippet } from "svelte";

    interface Props {
        children?: Snippet;
    }

    const { children }: Props = $props();

    const renderer = createSharedRenderer(Math.min(window.devicePixelRatio, 2));
    rendererContext.set(renderer);
</script>

{@render children?.()}
