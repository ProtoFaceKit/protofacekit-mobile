<script lang="ts">
    import Loader from "$lib/components/loader/Loader.svelte";
    import type { BluetoothDevice } from "$lib/types/bluetooth";

    interface Props {
        device: BluetoothDevice;
    }

    const { device }: Props = $props();
</script>

<div class="connecting">
    <Loader />
    <h1 class="title">Connecting</h1>

    <div class="device">
        <div class="device__details">
            <p class="device--name">{device.name}</p>
            <p class="device--address">{device.address}</p>
        </div>
    </div>
</div>

<style>
    .title {
        line-height: 1.25;
    }

    .connecting {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }

    .device__details {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
    }

    .device--address {
        color: #999;
    }

    .device {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
    }
</style>
