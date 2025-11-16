<script lang="ts">
    import { goto } from "$app/navigation";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import { toastErrorMessage } from "$lib/utils/error";
    import { toast } from "svelte-sonner";

    const context = faceContext.get();
    const face = $derived(context.face);

    const faceStore = faceStoreContext.get();

    let submitting = $state(false);

    async function onDelete() {
        submitting = true;

        const storePromise = faceStore.removeFace(face.id);
        toast.promise(storePromise, {
            loading: "Deleting face..",
            success: "Deleted face!",
            error: toastErrorMessage("Failed to delete face"),
        });

        try {
            await storePromise;
            await goto("/");
        } catch (_err) {
            // toast.promise catches this
        } finally {
            submitting = false;
        }
    }
</script>

<div>
    <h1>Confirm Delete</h1>
    <p>Are you sure you want to delete the <b>{face.name}</b> face?</p>

    <div class="actions">
        <a class="btn btn--span btn--large" href="/faces/{face.id}">Back</a>
        <button
            class="btn btn--span btn--large btn--primary"
            disabled={submitting}
            onclick={onDelete}
            type="button"
        >
            Delete
        </button>
    </div>
</div>

<style>
    .actions {
        display: flex;
        gap: 1rem;
        flex-shrink: 0;
        margin-top: 1rem;
    }
</style>
