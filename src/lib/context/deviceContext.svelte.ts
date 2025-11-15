import type { BleDevice } from "@mnlphlp/plugin-blec";
import { Context } from "runed";

interface DeviceContext {
    device: BleDevice;
}

export const deviceContext = new Context<DeviceContext>("DeviceContext");
