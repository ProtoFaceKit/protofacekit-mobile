<script lang="ts">
    import { discoverController, writeFace } from "$lib/ble";
    import FacePainter from "$lib/components/face/FacePainter.svelte";
    import FaceRenderer from "$lib/components/face/FaceRenderer.svelte";
    import PermissionGuard from "$lib/components/PermissionGuard.svelte";
    import ScanDevices from "$lib/components/ScanDevices.svelte";
    import { testFace } from "$lib/testData/testFace";
    import { connect } from "@mnlphlp/plugin-blec";

    async function flashTest() {
        const controller = await discoverController();
        if (controller === null) return;

        console.log("resolve", controller);
        await connect(controller.address, () => {});
        writeFace(testFace());
    }
</script>

<FacePainter />

<FaceRenderer face={testFace()} />

<PermissionGuard>
    <ScanDevices />
</PermissionGuard>

<button onclick={flashTest}>Flash Test</button>
