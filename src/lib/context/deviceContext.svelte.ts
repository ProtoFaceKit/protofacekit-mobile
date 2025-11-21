import type { BluetoothDevice } from "$lib/types/bluetooth";
import { Context } from "runed";

interface DeviceContext {
    device: BluetoothDevice;
    disconnect: VoidFunction;
}

export const deviceContext = new Context<DeviceContext>("DeviceContext");
