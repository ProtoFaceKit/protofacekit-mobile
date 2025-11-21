<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import DeviceDiscovery from "./DeviceDiscovery.svelte";

    const { Story } = defineMeta({
        title: "Components/Device/DeviceDiscovery",
        component: DeviceDiscovery,
    });
</script>

<Story
    name="Scanning"
    args={{
        scanningInterface: {
            devices: [],
            devicesLoading: true,
            devicesError: null,
            startScan() {},
            stopScan() {},
        },
        onAttemptConnect: () => {},
    }}
/>

<Story
    name="Scan Error"
    args={{
        scanningInterface: {
            devices: [],
            devicesLoading: false,
            devicesError: new Error("Failed to scan devices"),
            startScan() {},
            stopScan() {},
        },
        onAttemptConnect: () => {},
    }}
/>

<Story
    name="No Devices"
    args={{
        scanningInterface: {
            devices: [],
            devicesLoading: false,
            devicesError: new Error("Failed to scan devices"),
            startScan() {},
            stopScan() {},
        },
        onAttemptConnect: () => {},
    }}
/>

<Story
    name="Single Device"
    args={{
        scanningInterface: {
            devices: [{ name: "Example Device", address: "AA:BB:CC:DD:EE" }],
            devicesLoading: false,
            devicesError: new Error("Failed to scan devices"),
            startScan() {},
            stopScan() {},
        },
        onAttemptConnect: () => {},
    }}
/>

<Story
    name="Multiple Devices"
    args={{
        scanningInterface: {
            devices: [
                {
                    name: "Example Device 1",
                    address: "AA:BB:CC:DD:EE",
                },
                {
                    name: "Example Device 2",
                    address: "AA:BB:CC:DD:FF",
                },
            ],
            devicesLoading: false,
            devicesError: new Error("Failed to scan devices"),
            startScan() {},
            stopScan() {},
        },
        onAttemptConnect: () => {},
    }}
/>
