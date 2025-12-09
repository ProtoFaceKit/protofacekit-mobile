<script lang="ts">
    import { writeFace, writeMicCalibration } from "$lib/ble";
    import StoredFaceItem from "$lib/components/face/StoredFaceItem.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import Loader from "$lib/components/loader/Loader.svelte";
    import { toast } from "svelte-sonner";
    import { toastErrorMessage } from "$lib/utils/error";
    import { save } from "@tauri-apps/plugin-dialog";
    import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
    import { open } from "@tauri-apps/plugin-dialog";
    import { v4 } from "uuid";

    const faceStore = faceStoreContext.get();

    async function onExport() {
        const value = await faceStore.load();
        const encodedValue = JSON.stringify(value, null, 2);

        const path = await save({
            defaultPath: "ProtoFaceKitExport.json",
            filters: [
                {
                    name: "ProtoFaceKitExport",
                    extensions: ["json"],
                },
            ],
        });

        if (!path) return;

        await writeTextFile(path, encodedValue);
    }

    async function onImport() {
        const path = await open({
            multiple: false,
            directory: false,
            filters: [
                {
                    name: "ProtoFaceKitExport",
                    extensions: ["json"],
                },
            ],
        });

        if (!path) return;

        const raw = await readTextFile(path);
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return;
        }

        for (const face of parsed) {
            if (!("id" in face) || !("name" in face) || !("face" in face)) {
                continue;
            }

            await faceStore.appendFace({
                ...face,
                id: v4(),
            });
        }
    }

    let calibrating = $state(false);

    async function onCalibrate() {
        if (calibrating) return;

        const writePromise = writeMicCalibration();
        toast.promise(writePromise, {
            loading: "Calibrating microphone..",
            success: "Calibrated microphone!",
            error: toastErrorMessage("Failed to calibrate"),
        });

        try {
            await writePromise;
        } catch (_err) {
            // toast.promise catches this
        } finally {
            calibrating = false;
        }
    }
</script>

<div class="container">
    {#if faceStore.loading}
        <Loader />
        <p class="loading">Loading faces...</p>
    {:else if faceStore.error}
        <p>Failed to load faces</p>
    {:else}
        <div class="items">
            {#each faceStore.faces as face, i (i + face.id)}
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

    <button onclick={onExport} class="btn btn--large btn--span create">
        Export Faces
    </button>

    <button onclick={onImport} class="btn btn--large btn--span create">
        Import Faces
    </button>

    <button
        onclick={onCalibrate}
        disabled={calibrating}
        class="btn btn--large btn--span create"
    >
        {#if calibrating}
            Calibrating...
        {:else}
            Calibrate Microphone
        {/if}
    </button>
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
