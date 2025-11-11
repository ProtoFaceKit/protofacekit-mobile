<script lang="ts">
    import { startScan, type BleDevice } from "@mnlphlp/plugin-blec";
    import Device from "./Device.svelte";

    let devices: BleDevice[] = $state([]);
    let devicesLoading: boolean = $state(false);
    let devicesError: unknown = $state(null);

    async function onScan() {
        devicesLoading = true;
        try {
            await startScan((values) => {
                devices = values;
            }, 10_000);
        } catch (error) {
            devicesError = error;
        } finally {
            devicesLoading = false;
        }
    }
</script>

<button onclick={onScan}>Scan</button>

{#if devicesLoading}
    <p>Scanning...</p>
{:else if devicesError}
    <p>Failed to scan for devices</p>
{:else}
    <div class="devices">
        {#each devices as device (device.address)}
            <Device
                name={device.name}
                address={device.address}
                connected={device.isConnected}
            />
        {/each}
    </div>
{/if}

<style>
    .devices {
        display: flex;
        flex-flow: column;
        gap: 0.25rem;
    }
</style>
