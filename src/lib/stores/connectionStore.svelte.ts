import { connect, disconnect, type BleDevice } from "@mnlphlp/plugin-blec";

export interface ConnectionStore {
    connecting: BleDevice | undefined;
    connected: BleDevice | undefined;

    connectError: unknown | undefined;

    connect: (device: BleDevice) => Promise<void>;
    disconnect: VoidFunction;
    reset: VoidFunction;
}

export function createConnectionStore(): ConnectionStore {
    let connecting: BleDevice | undefined = $state();
    let connected: BleDevice | undefined = $state();

    let connectError: unknown = $state();

    let onDisconnectHandler: VoidFunction = () => {};

    async function onAttemptConnect(device: BleDevice) {
        if (connecting !== undefined) return;

        connecting = device;

        let isCurrent = true;
        onDisconnectHandler = () => {
            isCurrent = false;
        };

        try {
            await connect(device.address, () => {
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

    function onDisconnect() {
        if (!connected) return;
        connected = undefined;
        disconnect().then(onDisconnectHandler);
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
        connect: onAttemptConnect,
        disconnect: onDisconnect,
        reset: () => {
            onDisconnect();
            connecting = undefined;
            connected = undefined;
            connectError = undefined;
        },
    };
}
