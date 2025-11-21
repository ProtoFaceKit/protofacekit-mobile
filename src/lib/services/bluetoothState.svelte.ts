import { getAdapterState } from "@mnlphlp/plugin-blec";
import { resource } from "runed";

export interface BluetoothStateInterface {
    enabled: boolean;
    checking: boolean;
    check: VoidFunction;
}

export function createBluetoothStateInterface(): BluetoothStateInterface {
    const adapterState = resource(
        () => null,
        () => {
            return getAdapterState();
        },
    );

    return {
        get enabled() {
            return adapterState.current === "On";
        },

        get checking() {
            return adapterState.loading;
        },

        check() {
            adapterState.refetch();
        },
    };
}
