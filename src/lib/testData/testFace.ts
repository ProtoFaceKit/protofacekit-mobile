import { ExpressionType, type Face, type FaceFrame } from "$lib/types/data";

import idleFrame from "$lib/testData/frame0_idle_face1.json";
import talkingFrame from "$lib/testData/frame0_talking_face1.json";

export function testFace(): Face {
    return {
        expressions: {
            [ExpressionType.IDLE]: {
                frames: [
                    {
                        pixels: idleFrame.pixels as [number, number, number][],
                        duration: 255,
                    },
                ],
            },
            [ExpressionType.TALKING]: {
                frames: [
                    {
                        pixels: talkingFrame.pixels as [
                            number,
                            number,
                            number,
                        ][],
                        duration: 255,
                    },
                ],
            },
        },
    };
}

function testFaceFrame(): FaceFrame {
    type Pixel = [number, number, number];

    const pixels: Pixel[] = [];

    // Colors
    const colors = {
        bg: [0, 0, 0] as Pixel, // black background
        line: [0, 255, 255] as Pixel, // cyan glowing lines
        eye: [255, 0, 255] as Pixel, // brighter eyes
        highlight: [0, 0, 200] as Pixel, // accent highlights
    };

    // Build each row
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 128; x++) {
            let pixel: Pixel;

            // Left eye (sharp triangle)
            if (y >= 8 && y <= 14 && x >= 30 && x <= 38 && y - 8 <= x - 30) {
                pixel = colors.eye;
            }
            // Right eye (mirror)
            else if (
                y >= 8 &&
                y <= 14 &&
                x >= 90 &&
                x <= 98 &&
                y - 8 <= 98 - x
            ) {
                pixel = colors.eye;
            }
            // Face outline (top diagonal lines)
            else if (
                (y === 4 && x >= 40 && x <= 88) ||
                (y === 5 && x >= 38 && x <= 90)
            ) {
                pixel = colors.line;
            }
            // Jaw lines
            else if (
                (y === 27 && x >= 40 && x <= 88) ||
                (y === 26 && x >= 42 && x <= 86)
            ) {
                pixel = colors.line;
            }
            // Mouth / chin accent
            else if (y === 24 && x >= 54 && x <= 74) {
                pixel = colors.highlight;
            }
            // Nose line (center vertical)
            else if (x === 64 && y >= 16 && y <= 20) {
                pixel = colors.line;
            } else {
                pixel = [0, 0, 0];
            }

            pixels.push(pixel);
        }
    }

    return { duration: 100, pixels };
}
