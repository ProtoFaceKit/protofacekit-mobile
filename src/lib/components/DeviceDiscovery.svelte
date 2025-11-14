<script lang="ts">
    import { CONTROLLER_SERVICE_ID } from "$lib/ble";
    import { startScan, stopScan, type BleDevice } from "@mnlphlp/plugin-blec";
    import { onMount } from "svelte";
    import Device from "./Device.svelte";
    import DiscoveryLoader from "./DiscoveryLoader.svelte";

    interface Props {
        onAttemptConnect: (device: BleDevice) => void;
    }

    const { onAttemptConnect }: Props = $props();

    // 10s worth of device scanning
    const DEVICE_SCAN_TIMEOUT = 10_000;

    // Devices that have been discovered
    let discovered: BleDevice[] = $state([]);

    // Scanning state
    let scanning = $state(false);

    function onScan(abort: AbortController) {
        scanning = true;

        startScan((devices) => {
            if (abort.signal.aborted) return;

            discovered = devices
                // Only include devices with the desired service
                .filter((device) =>
                    device.services.includes(CONTROLLER_SERVICE_ID),
                );
        }, DEVICE_SCAN_TIMEOUT);

        const scanTimeout = setTimeout(() => {
            if (abort.signal.aborted) return;
            scanning = false;
        }, DEVICE_SCAN_TIMEOUT);

        abort.signal.addEventListener("abort", () => {
            clearTimeout(scanTimeout);
        });
    }

    onMount(() => {
        const abort = new AbortController();

        onScan(abort);

        return () => {
            stopScan();
            abort.abort();
        };
    });

    function onReScan() {
        if (scanning) return;

        const abort = new AbortController();
        onScan(abort);
    }
</script>

<div class="discovery">
    <h1 class="title">Lets find that Protogen...</h1>

    <div class="devices">
        {#each discovered as device, i (i)}
            <Device
                name={device.name}
                address={device.address}
                connected={device.isConnected}
                bonded={device.isBonded}
                onConnect={() => onAttemptConnect(device)}
            />
        {/each}
    </div>

    {#if scanning}
        <div class="scanning">
            <DiscoveryLoader />
            <p class="scanning__text">Searching for devices...</p>
        </div>
    {:else}
        <button class="scan-again" onclick={onReScan}>Scan Again</button>

        {#if discovered.length < 1}
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
        margin-top: 1rem;
        background-color: #222;
        color: #fff;
        font-weight: 500;
        border: none;
        border-radius: 0.4rem;
        padding: 0.5em 1em;
        cursor: pointer;
    }
</style>
