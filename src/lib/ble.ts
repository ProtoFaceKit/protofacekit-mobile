import { send } from "@mnlphlp/plugin-blec";
import { ExpressionType, type Face, type Pixel } from "$lib/types/data";
import { Mutex } from "async-mutex";

export const CONTROLLER_SERVICE_ID = "bd6f7967-023c-4f0b-aad4-16a8a116f62c";

const BEGIN_FACE_CHARACTERISTIC = "2a3f5ae2-c3bd-4561-945b-ea5da0787576";
const DISPLAY_FACE_CHARACTERISTIC = "e66d5e7a-7458-4d71-b625-331062166d74";
const BEGIN_EXPRESSION_CHARACTERISTIC = "d82855fb-c9ae-4322-9839-89d23839c569";
const BEGIN_FRAME_CHARACTERISTIC = "21bced55-0b96-4711-a0f5-cd9653aca013";
const FRAME_CHUNK_CHARACTERISTIC = "05940bf3-cc0f-4349-8ae4-e2bb89385540";
const MIC_CALIBRATION = "6594db1e-650c-4c39-be44-bdc19e220752";

const writeMutex = new Mutex();

export async function writeFace(face: Face) {
    await writeMutex.runExclusive(async () => {
        await writeFaceBle(face);
    });
}

export async function writeMicCalibration() {
    await send(MIC_CALIBRATION, [1], "withResponse", CONTROLLER_SERVICE_ID);
}

async function writeFaceBle(face: Face) {
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
            let duration = frame.duration;

            // When frames use larger durations than the protocol max of 255
            // we generate multiple frames using the same data
            while (duration > 0) {
                const frameDuration = Math.min(duration, 255);
                await send(
                    BEGIN_FRAME_CHARACTERISTIC,
                    [frameDuration],
                    "withResponse",
                    CONTROLLER_SERVICE_ID,
                );

                const chunks = encodeRLEPixelData(frame.pixels);

                for (const chunk of chunks) {
                    await send(
                        FRAME_CHUNK_CHARACTERISTIC,
                        chunk,
                        "withResponse",
                        CONTROLLER_SERVICE_ID,
                    );
                }

                if (duration <= 255) {
                    break;
                }

                duration -= 255;
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

// RLE encoded entry size (Used to prevent breaking entries)
const RLE_ENTRY_SIZE = 4;

/// Max size for RLE data that can be sent over the wire
const MAX_CHUNK_SIZE = 200;

function encodeRLEPixelData(pixels: Pixel[]): number[][] {
    const chunks: number[][] = [];

    let currentChunk: number[] = [];

    let i = 0;
    while (i < pixels.length) {
        const [r, g, b] = pixels[i];
        let runLength = 1;

        // Count consecutive identical pixels, up to max u8 (255)
        while (
            i + runLength < pixels.length &&
            runLength < 255 &&
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

        currentChunk.push(runLength & 0xff, r & 0xff, g & 0xff, b & 0xff);

        i += runLength;
    }

    // Push last chunk if it has data
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}
