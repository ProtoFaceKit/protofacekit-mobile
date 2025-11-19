<script lang="ts">
    import { checkPermissions } from "@mnlphlp/plugin-blec";
    import { Debounced } from "runed";
    import { type Snippet } from "svelte";
    import { scale, slide } from "svelte/transition";
    import SolarBluetoothCircleBroken from "~icons/solar/bluetooth-circle-broken";
    import SolarBluetoothCircleLinear from "~icons/solar/bluetooth-circle-linear";

    type Props = {
        children?: Snippet;
    };

    const { children }: Props = $props();

    let checkingPermissionGranted = $state(false);
    let permissionGranted = $state(false);

    const checkingDebounce = new Debounced(() => checkingPermissionGranted, 50);

    async function tryCheckPermission(grant: boolean, abort?: AbortController) {
        checkingPermissionGranted = true;
        try {
            const granted = await checkPermissions(grant);
            if (abort?.signal?.aborted) return;
            permissionGranted = granted;
        } catch (err) {
            console.error("failed to check permissions", err);
        } finally {
            if (abort?.signal?.aborted) return;
            checkingPermissionGranted = false;
        }
    }

    $effect(() => {
        const abort = new AbortController();

        checkingPermissionGranted = true;
        tryCheckPermission(false, abort);

        return () => {
            abort.abort();
            checkingPermissionGranted = false;
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
            onclick={() => tryCheckPermission(true)}
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
