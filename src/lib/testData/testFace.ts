import { ExpressionType, type Face, type Pixel } from "$lib/types/data";

import idleFrame from "$lib/testData/frame0_idle_face1.json";
import talkingFrame from "$lib/testData/frame0_talking_face1.json";

export function testFace(): Face {
    return {
        expressions: {
            [ExpressionType.IDLE]: {
                frames: [
                    {
                        pixels: idleFrame.pixels as [
                            number,
                            number,
                            number,
                        ][] as Pixel[],
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
                        ][] as Pixel[],
                        duration: 255,
                    },
                ],
            },
        },
    };
}
