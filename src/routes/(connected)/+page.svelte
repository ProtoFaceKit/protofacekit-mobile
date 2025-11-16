<script lang="ts">
    import { writeFace } from "$lib/ble";
    import StoredFaceItem from "$lib/components/face/StoredFaceItem.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import Loader from "$lib/components/Loader.svelte";
    import { toast } from "svelte-sonner";
    import { toastErrorMessage } from "$lib/utils/error";

    const faceStore = faceStoreContext.get();
</script>

<div class="container">
    {#if faceStore.loading}
        <Loader />
        <p class="loading">Loading faces...</p>
    {:else if faceStore.error}
        <p>Failed to load faces</p>
    {:else}
        <div class="items">
            {#each faceStore.faces as face (face.id)}
                <StoredFaceItem
                    item={face}
                    onShow={() => {
                        const writePromise = writeFace(face.face);
                        toast.promise(writePromise, {
                            loading: "Sending face...",
                            success: "Sent face to controller!",
                            error: toastErrorMessage("Failed to send face"),
                        });
                    }}
                />
            {:else}
                <p>No faces... create a new face to use</p>
            {/each}
        </div>
    {/if}

    <a class="btn btn--large btn--primary btn--span create" href="/create">
        Create Face
    </a>

    <a class="btn btn--large btn--span create" href="/oneshot"> One-shot </a>
</div>

<style>
    .container {
        padding: 1rem;
    }

    .items {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .create {
        margin-top: 1rem;
    }
</style>
