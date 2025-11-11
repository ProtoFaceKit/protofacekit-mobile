import { dev } from "$app/environment";
import {
    connect,
    listServices,
    send,
    startScan,
    stopScan,
    type BleDevice,
} from "@mnlphlp/plugin-blec";

const CONTROLLER_SERVICE_ID = "bd6f7967-023c-4f0b-aad4-16a8a116f62c";

const BEGIN_FACE_CHARACTERISTIC = "2a3f5ae2-c3bd-4561-945b-ea5da0787576";
const DISPLAY_FACE_CHARACTERISTIC = "e66d5e7a-7458-4d71-b625-331062166d74";
const BEGIN_EXPRESSION_CHARACTERISTIC = "d82855fb-c9ae-4322-9839-89d23839c569";
const BEGIN_FRAME_CHARACTERISTIC = "21bced55-0b96-4711-a0f5-cd9653aca013";
const FRAME_CHUNK_CHARACTERISTIC = "05940bf3-cc0f-4349-8ae4-e2bb89385540";

export function discoverController(
    timeout: number = 10_000,
): Promise<BleDevice | null> {
    let discovered = false;
    return new Promise((resolve, reject) => {
        startScan(async (devices) => {
            for (const device of devices) {
                if (device.name.startsWith("ProtoFaceKit")) {
                    discovered = true;

                    connect(device.address, () => {})
                        .then(() => listServices(device.address))
                        .then((servicesIn) => {
                            const services = Array.isArray(servicesIn)
                                ? servicesIn
                                : [];
                            if (
                                services.find(
                                    (service) =>
                                        service.uuid === CONTROLLER_SERVICE_ID,
                                ) !== undefined
                            ) {
                                resolve(device);

                                // Stop the scanner
                                stopScan().catch(() => {});
                            }
                        });
                }
            }
        }, timeout).catch((error) => {
            if (!discovered) reject();
        });

        setTimeout(() => {
            if (!discovered) resolve(null);
        }, timeout);
    });
}

export async function writeFace(face: Face) {
    await send(
        BEGIN_FACE_CHARACTERISTIC,
        [1],
        "withResponse",
        CONTROLLER_SERVICE_ID,
    );

    for (const key in face.expressions) {
        const expressionType = Number(key);
        const expression = face.expressions[expressionType as ExpressionType]!;

        await send(
            BEGIN_EXPRESSION_CHARACTERISTIC,
            [expressionType],
            "withResponse",
            CONTROLLER_SERVICE_ID,
        );

        for (const frame of expression.frames) {
            if (frame.duration > 255 || frame.duration < 1) {
                throw new Error("invalid frame duration");
            }

            await send(
                BEGIN_FRAME_CHARACTERISTIC,
                [frame.duration],
                "withResponse",
                CONTROLLER_SERVICE_ID,
            );

            const chunks = encodeRLEPixelData(frame.pixels);
            console.log(chunks[0].length);

            for (const chunk of chunks) {
                await send(
                    FRAME_CHUNK_CHARACTERISTIC,
                    chunk,
                    "withResponse",
                    CONTROLLER_SERVICE_ID,
                );
            }
        }
    }

    await send(
        DISPLAY_FACE_CHARACTERISTIC,
        [1],
        "withResponse",
        CONTROLLER_SERVICE_ID,
    );
}

export function testFace(): Face {
    return {
        expressions: {
            [ExpressionType.IDLE]: {
                frames: [testFaceFrame()],
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
        eye: [0, 180, 255] as Pixel, // brighter eyes
        highlight: [0, 255, 200] as Pixel, // accent highlights
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

export interface Face {
    expressions: Partial<Record<ExpressionType, FaceExpression>>;
}

export enum ExpressionType {
    IDLE = 0,
    TALKING = 1,
}

export interface FaceExpression {
    frames: FaceFrame[];
}

export interface FaceFrame {
    pixels: [number, number, number][];
    duration: number;
}

// RLE encoded entry size (Used to prevent breaking entries)
const RLE_ENTRY_SIZE = 4;

/// Max size for RLE data that can be sent over the wire
const MAX_CHUNK_SIZE = 248;

function encodeRLEPixelData(pixels: [number, number, number][]): number[][] {
    const chunks: number[][] = [];

    let currentChunk: number[] = [];

    let i = 0;
    while (i < pixels.length) {
        const [r, g, b] = pixels[i];
        let runLength = 1;

        // Count consecutive identical pixels, up to max u8 (255)
        while (
            i + runLength < pixels.length &&
            runLength < 0xff &&
            pixels[i + runLength][0] === r &&
            pixels[i + runLength][1] === g &&
            pixels[i + runLength][2] === b
        ) {
            runLength++;
        }

        // If adding this entry would exceed maxChunkSize, start new chunk
        if (currentChunk.length + RLE_ENTRY_SIZE > MAX_CHUNK_SIZE) {
            chunks.push(currentChunk);
            currentChunk = [];
        }

        // Encode length
        currentChunk.push(runLength & 0xff);

        // Encode color bytes
        currentChunk.push(r & 0xff, g & 0xff, b & 0xff);

        i += runLength;
    }

    // Push last chunk if it has data
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}
