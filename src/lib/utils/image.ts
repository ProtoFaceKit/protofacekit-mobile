import { FACE_PANEL_TOTAL_PIXELS } from "$lib/constants";
import type { Pixel } from "$lib/types/data";

export function quantizePixel([r, g, b]: Pixel, step = 16): Pixel {
    // snap each channel to nearest step value
    return [
        Math.min(Math.round(r / step) * step, 255),
        Math.min(Math.round(g / step) * step, 255),
        Math.min(Math.round(b / step) * step, 255),
    ];
}

export function rgb8to4([r, g, b]: Pixel): Pixel {
    return [r >> 4, g >> 4, b >> 4];
}

export function createDefaultFramePixels() {
    const defaultPixelData: Pixel[] = Array.from(
        { length: FACE_PANEL_TOTAL_PIXELS },
        () => [0, 0, 0],
    );
    return defaultPixelData;
}

const GAMMA_TABLE = createGammaTable(2.0);

function createGammaTable(gamma = 2.2) {
    const table = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        table[i] = Math.round(Math.pow(i / 255, gamma) * 255);
    }
    return table;
}

const BRIGHTNESS = 1.0;

export function applyPixelAdjustments(
    pixels: Pixel[],
    gamma: number,
    brightness: number,
): Pixel[] {
    const gammaTable = createGammaTable(gamma);

    return pixels.map(([r, g, b]) => {
        return [
            applyBrightness(applyGamma(r, gammaTable), brightness),
            applyBrightness(applyGamma(g, gammaTable), brightness),
            applyBrightness(applyGamma(b, gammaTable), brightness),
        ];
    });
}

export function applyAdjustments([r, g, b]: Pixel): Pixel {
    return [
        applyBrightness(applyGamma(r)),
        applyBrightness(applyGamma(g)),
        applyBrightness(applyGamma(b)),
    ];
}

function applyGamma(value: number, table: Uint8Array = GAMMA_TABLE): number {
    return table[value];
}

function applyBrightness(
    value: number,
    brightness: number = BRIGHTNESS,
): number {
    return Math.min(Math.floor(value * brightness), 255);
}
