<script lang="ts">
    import { getAdapterState } from "@mnlphlp/plugin-blec";
    import { resource } from "runed";
    import { type Snippet } from "svelte";
    import { slide } from "svelte/transition";
    import SolarBluetoothCircleBroken from "~icons/solar/bluetooth-circle-broken";
    import SolarBluetoothCircleLinear from "~icons/solar/bluetooth-circle-linear";

    type Props = {
        children?: Snippet;
    };

    const { children }: Props = $props();

    let checkingEnabled = $state(false);

    const adapterState = resource(
        () => null,
        () => {
            return getAdapterState();
        },
    );
</script>

{#if adapterState.loading}
    <div class="container" transition:slide={{ delay: 10, duration: 300 }}>
        <SolarBluetoothCircleLinear width={64} height={64} />
        <h1 class="title">Checking Bluetooth</h1>
        <p class="text">Checking for required bluetooth capabilities...</p>
    </div>
{:else if adapterState.current === "On"}
    {@render children?.()}
{:else}
    <div class="container" transition:slide={{ delay: 10, duration: 300 }}>
        <SolarBluetoothCircleBroken width={64} height={64} color="#ff7777" />

        <h1 class="title">Bluetooth not enabled</h1>
        <p class="text">Please enable <b>Bluetooth</b> to use this app</p>
        <button
            class="btn btn--large"
            onclick={() => adapterState.refetch()}
            disabled={checkingEnabled}
        >
            Reload
        </button>
    </div>
{/if}

<style>
    .container {
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        width: 100%;
        height: 100%;
        gap: 1rem;
    }

    .text {
        color: #ccc;
    }
</style>
