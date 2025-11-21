<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import DeviceConnecting from "./DeviceConnecting.svelte";

    const { Story } = defineMeta({
        title: "Components/Device/DeviceConnecting",
        component: DeviceConnecting,
    });
</script>

<Story
    name="Default"
    args={{
        device: {
            name: "Example Device",
            address: "AA:BB:CC:DD::EE",
        },
    }}
/>
