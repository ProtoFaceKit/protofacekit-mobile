<script lang="ts">
    import "$lib/styles/global.css";
    import { connect, disconnect, type BleDevice } from "@mnlphlp/plugin-blec";
    import type { LayoutProps } from "./$types";
    import DeviceDiscovery from "$lib/components/DeviceDiscovery.svelte";
    import DeviceConnecting from "$lib/components/DeviceConnecting.svelte";
    import DeviceConnectError from "$lib/components/DeviceConnectError.svelte";
    import PermissionGuard from "$lib/components/PermissionGuard.svelte";
    import { deviceContext } from "$lib/context/deviceContext.svelte";

    const { children }: LayoutProps = $props();

    let connecting: BleDevice | undefined = $state();
    let connected: BleDevice | undefined = $state();

    let connectError: unknown = $state();

    let onDisconnectHandler: VoidFunction = () => {};

    deviceContext.set({
        get device() {
            return connected!;
        },
    });

    async function onAttemptConnect(device: BleDevice) {
        if (connecting !== undefined) return;

        connecting = device;

        let isCurrent = true;
        onDisconnectHandler = () => {
            isCurrent = false;
        };

        try {
            await connect(device.address, () => {
                if (!isCurrent) return;

                connected = undefined;
            });

            connecting = undefined;
            connected = device;
        } catch (err) {
            console.error("failed to connect");
            connectError = err;
        }
    }

    function onDisconnect() {
        if (!connected) return;
        connected = undefined;
        disconnect().then(onDisconnectHandler);
    }
</script>

<PermissionGuard>
    {#if connected}
        {@render children?.()}
    {:else if connecting}
        {#if connectError}
            <DeviceConnectError
                onBack={() => {
                    connected = undefined;
                    connecting = undefined;
                    connectError = undefined;
                }}
            />
        {:else}
            <DeviceConnecting device={connecting} />
        {/if}
    {:else}
        <DeviceDiscovery {onAttemptConnect} />
    {/if}
</PermissionGuard>
