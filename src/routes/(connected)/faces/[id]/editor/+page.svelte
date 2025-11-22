<script lang="ts">
    import FaceEditor from "$lib/components/editor/FaceEditor.svelte";
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
    <div class="heading">
        <div class="path">
            <p class="path--segment">Faces /</p>
            <h1 class="path--name">{storedFace.name}</h1>
        </div>

        <div class="actions">
            <button class="btn btn--primary" onclick={onSave} disabled={saving}>
                Save
            </button>
            <a class="btn" href="/">Back</a>
        </div>
    </div>

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

    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        margin-bottom: 0.5rem;
        padding: 0 0.5rem;
    }

    .path {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;
        align-items: center;
        flex: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 0.5rem;
    }

    .path--name {
        color: #fff;
        font-size: 1.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .path--segment {
        color: #999;
        font-size: 1.25rem;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }
</style>
