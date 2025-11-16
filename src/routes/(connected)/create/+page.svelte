<script lang="ts">
    import { goto } from "$app/navigation";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import type { StoredFace } from "$lib/types/faceStore";
    import { toastErrorMessage } from "$lib/utils/error";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { v4 } from "uuid";

    let submitting = $state(false);

    let name = $state("");

    const faceStore = faceStoreContext.get();

    async function onSubmit(event: SubmitEvent) {
        event.preventDefault();

        const face: StoredFace = {
            id: v4(),
            face: { expressions: {} },
            name,
        };

        name = "";
        submitting = true;

        const storePromise = faceStore.appendFace(face);
        toast.promise(storePromise, {
            loading: "Creating face..",
            success: "Created face!",
            error: toastErrorMessage("Failed to create face"),
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

    onMount(() => {
        name = "";
    });
</script>

<div class="heading">
    <h1>Create Face</h1>
    <a class="btn" href="/">Back</a>
</div>

<form class="form" onsubmit={onSubmit}>
    <div class="form-field">
        <label for="name">Name</label>
        <input
            placeholder="Test Face"
            type="text"
            id="name"
            class="input"
            minlength={1}
            required
            bind:value={name}
        />
        <p class="form-field__description">Give this face a name</p>
    </div>

    <button
        type="submit"
        class="btn btn--large btn--span btn--primary"
        disabled={submitting}
    >
        Create
    </button>
</form>

<style>
    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .heading > h1 {
        font-size: 1.25rem;
    }

    .form {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .form-field {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }

    .form-field__description {
        font-size: 0.8rem;
        color: #999;
    }
</style>
