<script lang="ts">
    import "$lib/styles/global.css";
    import type { LayoutProps } from "./$types";
    import DeviceDiscovery from "$lib/components/DeviceDiscovery.svelte";
    import DeviceConnecting from "$lib/components/DeviceConnecting.svelte";
    import DeviceConnectError from "$lib/components/DeviceConnectError.svelte";
    import PermissionGuard from "$lib/components/guards/PermissionGuard.svelte";
    import { deviceContext } from "$lib/context/deviceContext.svelte";
    import { createFaceStore } from "$lib/stores/faceStore.svelte";
    import { faceStoreContext } from "$lib/context/faceStoreContext.svelte";
    import AppToaster from "$lib/components/AppToaster.svelte";
    import BluetoothEnabledGuard from "$lib/components/guards/BluetoothEnabledGuard.svelte";
    import { createBluetoothScanningInterface } from "$lib/services/bluetoothScanning.svelte";
    import { createBluetoothConnectionInterface } from "$lib/services/bluetoothConnection.svelte";
    import { createBluetoothPermissionInterface } from "$lib/services/bluetoothPermission.svelte";
    import { createBluetoothStateInterface } from "$lib/services/bluetoothState.svelte";

    const { children }: LayoutProps = $props();

    // 10s worth of device scanning
    const DEVICE_SCAN_TIMEOUT = 10_000;

    const stateInterface = createBluetoothStateInterface();
    const scanningInterface = createBluetoothScanningInterface({
        timeout: DEVICE_SCAN_TIMEOUT,
    });
    const connectionInterface = createBluetoothConnectionInterface();
    const permissionInterface = createBluetoothPermissionInterface();

    const faceStore = createFaceStore();
    faceStoreContext.set(faceStore);

    deviceContext.set({
        get device() {
            return connectionInterface.connected!;
        },
        disconnect: connectionInterface.disconnect,
    });
</script>

<BluetoothEnabledGuard {stateInterface}>
    <PermissionGuard {permissionInterface}>
        {#if connectionInterface.connected}
            {@render children?.()}
        {:else if connectionInterface.connecting}
            {#if connectionInterface.connectError}
                <DeviceConnectError onBack={connectionInterface.reset} />
            {:else}
                <DeviceConnecting device={connectionInterface.connecting} />
            {/if}
        {:else}
            <DeviceDiscovery
                {scanningInterface}
                onAttemptConnect={connectionInterface.connect}
            />
        {/if}
    </PermissionGuard>

    <AppToaster />
</BluetoothEnabledGuard>
