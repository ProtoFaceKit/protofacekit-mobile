<script lang="ts">
    import type { BluetoothPermissionInterface } from "$lib/services/bluetoothPermission.svelte";
    import { Debounced } from "runed";
    import { type Snippet } from "svelte";
    import { slide } from "svelte/transition";
    import SolarBluetoothCircleBroken from "~icons/solar/bluetooth-circle-broken";
    import SolarBluetoothCircleLinear from "~icons/solar/bluetooth-circle-linear";

    type Props = {
        permissionInterface: BluetoothPermissionInterface;
        children?: Snippet;
    };

    const { permissionInterface, children }: Props = $props();

    let checkingPermissionGranted = $state(false);
    let permissionGranted = $state(false);

    const checkingDebounce = new Debounced(
        () => permissionInterface.checking,
        50,
    );

    $effect(() => {
        permissionInterface.check();
        return () => {
            permissionInterface.cancel();
        };
    });
</script>

{#if checkingDebounce.current}
    <div class="container" transition:slide={{ delay: 10, duration: 300 }}>
        <SolarBluetoothCircleLinear width={64} height={64} />
        <h1 class="title">Checking permissions</h1>
        <p class="text">
            Checking for required bluetooth access permissions...
        </p>
    </div>
{:else if permissionGranted}
    {@render children?.()}
{:else}
    <div class="container" transition:slide={{ delay: 10, duration: 300 }}>
        <SolarBluetoothCircleBroken width={64} height={64} color="#ff7777" />

        <h1 class="title">Bluetooth access not granted</h1>
        <p class="text">Please grant required permissions</p>
        <button
            class="btn btn--large"
            onclick={permissionInterface.grant}
            disabled={checkingPermissionGranted}
        >
            Grant
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
