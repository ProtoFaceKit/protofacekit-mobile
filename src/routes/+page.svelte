<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FacePainter from "$lib/components/face/FacePainter.svelte";
    import FaceRenderer from "$lib/components/face/FaceRenderer.svelte";
    import { testFace } from "$lib/testData/testFace";
    import { type BleDevice } from "@mnlphlp/plugin-blec";

    let device: BleDevice | undefined;

    async function flashTest() {
        console.log("resolve", device);
        writeFace(testFace());
    }
</script>

<FacePainter />

<FaceRenderer face={testFace()} />

<button onclick={flashTest}>Flash Test</button>
