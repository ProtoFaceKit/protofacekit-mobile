<script lang="ts">
    import FaceEditor from "$lib/components/editor/FaceEditor.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import type { Face } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { toast } from "svelte-sonner";

    const faceStore = faceStoreContext.get();

    const context = faceContext.get();
    const storedFace = $derived(context.face);

    let saving = $state(false);

    async function onSave(face: Face) {
        saving = true;

        const savePromise = faceStore.updateFace({
            ...storedFace,
            face,
        });
        toast.promise(savePromise, {
            loading: "Saving face..",
            success: "Saved face!",
            error: toastErrorMessage("Failed to save face"),
        });

        try {
            await savePromise;

            faceStore.appendFace;
        } catch (_err) {
            // toast.promise catches this
        } finally {
            saving = false;
        }
    }
</script>

<FaceEditor
    name={storedFace.name}
    initialFace={storedFace.face}
    {onSave}
    {saving}
/>
