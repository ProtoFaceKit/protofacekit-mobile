<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import DeviceConnectError from "./DeviceConnectError.svelte";

    const { Story } = defineMeta({
        title: "Components/Device/DeviceConnectError",
        component: DeviceConnectError,
    });
</script>

<Story
    name="Default"
    args={{
        onBack: () => {},
    }}
/>
