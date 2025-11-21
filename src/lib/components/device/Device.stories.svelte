<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import Device from "./Device.svelte";
    import type { ComponentProps } from "svelte";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Device/Device",
        component: Device,
    });
</script>

{#snippet template(props: ComponentProps<typeof Device>)}
    <div style="width: 100%; display: flex; flex-flow: column; padding: 1rem;">
        <Device {...props} />
    </div>
{/snippet}

<Story
    name="Default"
    args={{
        name: "Example Device",
        address: "AA:BB:CC:DD:EE",
        onConnect: () => {},
    }}
/>

<Story
    name="Default with mac address name"
    args={{
        name: "AA:BB:CC:DD:EE",
        address: "AA:BB:CC:DD:EE",
        onConnect: () => {},
    }}
/>
