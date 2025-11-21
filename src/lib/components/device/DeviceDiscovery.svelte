<script lang="ts">
    import { onMount } from "svelte";
    import Device from "./Device.svelte";
    import DiscoveryLoader from "$lib/components/loader/DiscoveryLoader.svelte";
    import type { BluetoothDevice } from "$lib/types/bluetooth";
    import type { BluetoothScanningInterface } from "$lib/services/bluetoothScanning.svelte";

    interface Props {
        /** Interface for interacting with the bluetooth scanner */
        scanningInterface: BluetoothScanningInterface;

        /** Callback to connect to a device */
        onAttemptConnect: (device: BluetoothDevice) => void;
    }

    const { scanningInterface, onAttemptConnect }: Props = $props();

    onMount(() => {
        scanningInterface.startScan();

        return () => {
            scanningInterface.stopScan();
        };
    });

    function onReScan() {
        if (scanningInterface.devicesLoading) return;
        scanningInterface.startScan();
    }
</script>

<div class="discovery">
    <h1 class="title">Lets find that Protogen...</h1>

    <div class="devices">
        {#each scanningInterface.devices as device, i (i)}
            <Device
                name={device.name}
                address={device.address}
                onConnect={() => onAttemptConnect(device)}
            />
        {/each}
    </div>

    {#if scanningInterface.devicesLoading}
        <div class="scanning">
            <DiscoveryLoader />
            <p class="scanning__text">Searching for devices...</p>
        </div>
    {:else}
        <button class="scan-again" onclick={onReScan}>Scan Again</button>

        {#if scanningInterface.devices.length < 1}
            <p>No devices found...</p>
        {/if}
    {/if}
</div>

<style>
    .discovery {
        padding: 1rem;
    }

    .title {
        line-height: 1.25;
        margin-bottom: 1rem;
    }

    .devices {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .scanning {
        display: flex;
        flex-flow: row;
        gap: 1rem;
        align-items: center;
        width: 100%;
        margin: 1rem 0;
    }

    .scanning__text {
        color: #ccc;
    }

    .scan-again {
        display: block;
        width: 100%;
        margin: 1rem 0;
        background-color: #222;
        color: #fff;
        font-weight: 500;
        border: none;
        border-radius: 0.4rem;
        padding: 0.5em 1em;
        cursor: pointer;
    }
</style>
