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

<div>
    <h1>
        {device.name}
    </h1>

    <div>
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
</div>

<!--
<FacePainter />

<FaceRenderer face={testFace()} />

<button onclick={flashTest}>Flash Test</button> -->
