<script lang="ts">
    type Props = {
        name: string;
        address: string;
        connected: boolean;
    };

    const { name, address, connected }: Props = $props();
</script>

<div class="device">
    <div class="device__details">
        <p class="device--name">{name}</p>
        <p class="device--address">{address}</p>
    </div>

    <div>
        {#if connected}
            <span>Connected</span>
        {/if}
    </div>
</div>

<style>
    .device {
        display: flex;
    }

    .device_details {
        display: flex;
        flex-flow: columns;
    }
</style>
