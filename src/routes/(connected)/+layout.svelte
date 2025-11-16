<script lang="ts">
    import { deviceContext } from "$lib/context/deviceContext.svelte";
    import icon from "$lib/assets/protofacekit.svg";
    import type { LayoutProps } from "./$types";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";
    import { rendererContext } from "$lib/context/rendererContext.svelte";
    import { WebGLRenderer } from "three";

    const context = deviceContext.get();
    const device = $derived(context.device);

    const { children }: LayoutProps = $props();

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererContext.set(renderer);
</script>

<div class="view">
    <div class="header">
        <div class="header__text">
            <a href="/">
                <img src={icon} alt="Logo" height={38} />
            </a>

            <div class="device">
                <h1 class="device__name">{device.name}</h1>
                <p class="device__address">{device.address}</p>
            </div>
        </div>
        <button
            class="btn"
            onclick={() => {
                toast.loading("Disconnecting...");
                context.disconnect();
            }}
        >
            Disconnect
        </button>
    </div>

    <div class="container">
        {@render children?.()}
    </div>
</div>

<style>
    .view {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-flow: column;
    }

    .header {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding: 1rem;
        border-bottom: 1px solid #222;
    }

    .header__text {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .device__name {
        font-size: 1rem;
    }

    .device__address {
        font-size: 0.9rem;
        color: #999;
    }

    .container {
        flex: auto;
        overflow: auto;
    }
</style>
