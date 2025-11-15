<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FacePainter from "$lib/components/face/FacePainter.svelte";
    import FaceRenderer from "$lib/components/face/FaceRenderer.svelte";
    import StoredFaceItem from "$lib/components/face/StoredFaceItem.svelte";
    import { deviceContext } from "$lib/context/deviceContext.svelte";
    import { testFace } from "$lib/testData/testFace";
    import type { Face } from "$lib/types/data";
    import type { StoredFace } from "$lib/types/face";
    import { type BleDevice } from "@mnlphlp/plugin-blec";
    import icon from "$lib/assets/protofacekit.svg";

    const faces: StoredFace[] = [
        {
            id: "test",
            name: "Test Face",
            face: testFace(),
        },
    ];

    const context = deviceContext.get();
    const device = $derived(context.device);
</script>

<div class="header">
    <div class="header__text">
        <img src={icon} alt="Logo" height={38} />
        <div class="device">
            <h1 class="device__name">{device.name}</h1>
            <p class="device__address">{device.address}</p>
        </div>
    </div>
    <button
        class="disconnect"
        onclick={() => {
            context.disconnect();
        }}
    >
        Disconnect
    </button>
</div>

<div class="container">
    <div class="items">
        {#each faces as face (face.id)}
            <StoredFaceItem
                item={face}
                onShow={() => {
                    writeFace(face.face);
                }}
            />
        {:else}
            <p>No faces... create a new face to use</p>
        {/each}
    </div>

    <button class="create">Create Face</button>
</div>

<style>
    .header {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding: 1rem;
        border-bottom: 1px solid #222;
    }

    .header__text {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .device__name {
        font-size: 1rem;
    }

    .device__address {
        font-size: 0.9rem;
        color: #999;
    }

    .container {
        padding: 1rem;
    }

    .items {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .disconnect {
        display: block;
        background-color: #222;
        color: #fff;
        font-weight: 500;
        border: none;
        border-radius: 0.4rem;
        padding: 0.5em 1em;
        cursor: pointer;
    }

    .create {
        display: block;
        width: 100%;
        margin-top: 1rem;
        background-color: #622d2d;
        color: #fff;
        font-weight: 500;
        border: none;
        border-radius: 0.4rem;
        padding: 0.75em 1em;
        cursor: pointer;
    }
</style>
