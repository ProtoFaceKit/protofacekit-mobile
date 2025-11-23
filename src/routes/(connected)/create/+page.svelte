<script lang="ts">
    import { goto } from "$app/navigation";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";
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

<div class="container">
    <PageHeading name="Create Face">
        {#snippet actions()}
            <a class="btn" href="/">Back</a>
        {/snippet}
    </PageHeading>

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
</div>

<style>
    .form {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        padding: 1rem;
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
