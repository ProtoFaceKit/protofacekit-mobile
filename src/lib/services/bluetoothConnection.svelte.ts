import type { BluetoothDevice } from "$lib/types/bluetooth";
import {
    connect as connectBle,
    disconnect as disconnectBle,
} from "@mnlphlp/plugin-blec";

export interface BluetoothConnectionInterface {
    connecting: BluetoothDevice | undefined;
    connected: BluetoothDevice | undefined;
    connectError: unknown | undefined;

    connect: (device: BluetoothDevice) => Promise<void>;
    disconnect: VoidFunction;
    reset: VoidFunction;
}

export function createBluetoothConnectionInterface(): BluetoothConnectionInterface {
    let connecting: BluetoothDevice | undefined = $state();
    let connected: BluetoothDevice | undefined = $state();
    let connectError: unknown = $state();

    let onDisconnectHandler: VoidFunction = () => {};

    async function connect(device: BluetoothDevice) {
        if (connecting !== undefined) return;

        connecting = device;

        let isCurrent = true;
        onDisconnectHandler = () => {
            isCurrent = false;
        };

        try {
            await connectBle(device.address, () => {
                if (!isCurrent) return;

                connected = undefined;
            });

            connecting = undefined;
            connected = device;
        } catch (err) {
            console.error("failed to connect");
            connectError = err;
        }
    }

    function disconnect() {
        if (!connected) return;
        connected = undefined;
        disconnectBle().then(onDisconnectHandler).catch(console.error);
    }

    return {
        get connecting() {
            return connecting;
        },
        get connected() {
            return connected;
        },
        get connectError() {
            return connectError;
        },
        connect,
        disconnect,
        reset: () => {
            disconnect();
            connecting = undefined;
            connected = undefined;
            connectError = undefined;
        },
    };
}
