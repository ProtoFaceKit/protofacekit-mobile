import { CONTROLLER_SERVICE_ID } from "$lib/ble";
import type { BluetoothDevice } from "$lib/types/bluetooth";
import {
    startScan as startScanBle,
    stopScan as stopScanBle,
} from "@mnlphlp/plugin-blec";

export interface BluetoothScanningInterfaceOptions {
    timeout?: number;
}

export interface BluetoothScanningInterface {
    devices: BluetoothDevice[];
    devicesLoading: boolean;
    devicesError: unknown | null;

    startScan: () => void;
    stopScan: () => void;
}

export function createBluetoothScanningInterface({
    timeout,
}: BluetoothScanningInterfaceOptions): BluetoothScanningInterface {
    let devices: BluetoothDevice[] = $state([]);
    let devicesLoading: boolean = $state(false);
    let devicesError: unknown = $state(null);

    let scanAbort: AbortController | undefined;

    function startScan() {
        if (devicesLoading) {
            return;
        }

        if (scanAbort !== undefined) {
            scanAbort.abort();
        }

        const abort = new AbortController();
        scanAbort = abort;

        devicesLoading = true;

        startScanBle((values) => {
            if (abort.signal.aborted) return;

            devices = values
                // Only include devices with the desired service
                .filter((device) =>
                    device.services.includes(CONTROLLER_SERVICE_ID),
                )
                // Map to only the properties we need
                .map((device) => ({
                    name: device.name,
                    address: device.address,
                }));
        }, 10_000).catch((error) => {
            if (abort.signal.aborted) return;
            devicesError = error;
        });

        const scanTimeout = setTimeout(() => {
            if (abort.signal.aborted) return;
            devicesLoading = false;
        }, timeout);

        abort.signal.addEventListener("abort", () => {
            clearTimeout(scanTimeout);
        });
    }

    function stopScan() {
        scanAbort?.abort();
        stopScanBle().catch(() => {});
    }

    $effect(() => {
        return () => {
            stopScan();
        };
    });

    return {
        get devices() {
            return devices;
        },
        get devicesLoading() {
            return devicesLoading;
        },
        get devicesError() {
            return devicesError;
        },
        startScan,
        stopScan,
    };
}
