<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import BluetoothEnabledGuard from "./BluetoothEnabledGuard.svelte";

    const { Story } = defineMeta({
        title: "Components/Guards/BluetoothEnabledGuard",
        component: BluetoothEnabledGuard,
    });
</script>

<Story
    name="Checking"
    args={{
        stateInterface: {
            enabled: false,
            checking: true,
            check: () => {},
        },
    }}
/>

<Story
    name="Bluetooth Enabled"
    args={{
        stateInterface: {
            enabled: true,
            checking: false,
            check: () => {},
        },
    }}
>
    <p style="color: #fff">Bluetooth is enabled</p>
</Story>

<Story
    name="Bluetooth Disabled"
    args={{
        stateInterface: {
            enabled: false,
            checking: false,
            check: () => {},
        },
    }}
/>
