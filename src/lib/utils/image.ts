import type { Pixel } from "$lib/types/data";

export function quantizePixel([r, g, b]: Pixel, step = 16): Pixel {
    // snap each channel to nearest step value
    return [
        Math.min(Math.round(r / step) * step, 255),
        Math.min(Math.round(g / step) * step, 255),
        Math.min(Math.round(b / step) * step, 255),
    ];
}
