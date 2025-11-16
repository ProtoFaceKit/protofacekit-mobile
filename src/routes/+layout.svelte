<script lang="ts">
    import "$lib/styles/global.css";
    import type { LayoutProps } from "./$types";
    import DeviceDiscovery from "$lib/components/DeviceDiscovery.svelte";
    import DeviceConnecting from "$lib/components/DeviceConnecting.svelte";
    import DeviceConnectError from "$lib/components/DeviceConnectError.svelte";
    import PermissionGuard from "$lib/components/PermissionGuard.svelte";
    import { deviceContext } from "$lib/context/deviceContext.svelte";
    import { createFaceStore } from "$lib/stores/faceStore.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import { createConnectionStore } from "$lib/stores/connectionStore.svelte";
    import AppToaster from "$lib/components/AppToaster.svelte";

    const { children }: LayoutProps = $props();

    const connectionStore = createConnectionStore();
    const faceStore = createFaceStore();
    faceStoreContext.set(faceStore);

    deviceContext.set({
        get device() {
            return connectionStore.connected!;
        },
        disconnect: connectionStore.disconnect,
    });
</script>

<PermissionGuard>
    {#if connectionStore.connected}
        {@render children?.()}
    {:else if connectionStore.connecting}
        {#if connectionStore.connectError}
            <DeviceConnectError onBack={connectionStore.reset} />
        {:else}
            <DeviceConnecting device={connectionStore.connecting} />
        {/if}
    {:else}
        <DeviceDiscovery onAttemptConnect={connectionStore.connect} />
    {/if}
</PermissionGuard>

<AppToaster />
