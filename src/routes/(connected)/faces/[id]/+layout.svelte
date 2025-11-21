<script lang="ts">
    import type { LayoutProps } from "./$types";
    import Loader from "$lib/components/loader/Loader.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";

    const { children, params }: LayoutProps = $props();

    const id = $derived(params.id);
    const faceStore = faceStoreContext.get();
    const face = $derived(faceStore.faces.find((face) => face.id === id));

    faceContext.set({
        get face() {
            return face!;
        },
    });
</script>

<div class="container">
    {#if faceStore.loading}
        <Loader />
        <p class="loading">Loading faces...</p>
    {:else if faceStore.error}
        <p>Failed to load faces</p>
    {:else if face}
        {@render children()}
    {:else}
        Face not found
    {/if}
</div>

<style>
    .container {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
</style>
