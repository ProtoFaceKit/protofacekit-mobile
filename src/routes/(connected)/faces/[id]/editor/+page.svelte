<script lang="ts">
    import FaceEditor from "$lib/components/editor/FaceEditor.svelte";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import { stateWithInitial } from "$lib/helpers/stateWithInitial.svelte";
    import type { Face } from "$lib/types/data";
    import { deepClone } from "$lib/utils/clone";
    import { toastErrorMessage } from "$lib/utils/error";
    import { toast } from "svelte-sonner";

    const faceStore = faceStoreContext.get();

    const context = faceContext.get();
    const storedFace = $derived(context.face);

    const face = stateWithInitial<Face>(() => deepClone(storedFace.face));

    let saving = $state(false);

    async function onSave() {
        saving = true;

        const savePromise = faceStore.updateFace({
            ...storedFace,
            face: face.current,
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

<div class="container">
    <PageHeading path={["Faces"]} name={storedFace.name}>
        {#snippet actions()}
            <button class="btn btn--primary" onclick={onSave} disabled={saving}>
                Save
            </button>
            <a class="btn" href="/">Back</a>
        {/snippet}
    </PageHeading>

    <FaceEditor
        face={face.current}
        onChangeFace={(value) => {
            face.current = value;
        }}
    />
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        height: 100%;
        overflow: hidden;
    }
</style>
