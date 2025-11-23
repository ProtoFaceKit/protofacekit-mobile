<script lang="ts">
    import { writeFace } from "$lib/ble";
    import { FACE_PANEL_HEIGHT, FACE_PANEL_WIDTH } from "$lib/constants";
    import {
        ExpressionType,
        type Face,
        type FaceFrame,
        type Pixel,
    } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { open } from "@tauri-apps/plugin-dialog";
    import { readFile } from "@tauri-apps/plugin-fs";
    import { toast } from "svelte-sonner";
    import { parseGIF, decompressFrames } from "gifuct-js";
    import { quantizePixel } from "$lib/utils/image";
    import ExpressionEditor from "$lib/components/editor/ExpressionEditor.svelte";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";

    let face: Face | null = $state(null);

    async function onUploadFile(path: string) {
        const raw = await readFile(path);

        const gif = parseGIF(raw.buffer);
        const frames: FaceFrame[] = [];

        const gifFrames = decompressFrames(gif, true);

        const { canvas, ctx } = createCanvas();

        const temp = document.createElement("canvas");
        const tempCtx = temp.getContext("2d");
        if (!tempCtx) return;

        let frameImageData: ImageData | undefined;

        for (const gifFrame of gifFrames) {
            const { patch, dims } = gifFrame;

            if (
                !frameImageData ||
                dims.width !== frameImageData.width ||
                dims.height !== frameImageData.height
            ) {
                temp.width = dims.width;
                temp.height = dims.height;
                frameImageData = tempCtx.createImageData(
                    dims.width,
                    dims.height,
                );
            }

            frameImageData.data.set(patch);
            tempCtx.putImageData(frameImageData, 0, 0);

            ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            ).data;

            const pixels: Pixel[] = [];
            for (let i = 0; i < imageData.length; i += 4) {
                pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
            }

            const mirroredPixels = mirrorPixelsHorizontally(
                pixels,
                FACE_PANEL_WIDTH,
            );

            frames.push({
                duration: gifFrame.delay,
                pixels: mirroredPixels,
            });
        }

        const MAX_FRAMES = 25;

        if (frames.length > MAX_FRAMES) {
            const reduced: FaceFrame[] = [];
            const step = frames.length / MAX_FRAMES;

            for (let i = 0; i < MAX_FRAMES; i++) {
                const index = Math.floor(i * step);
                reduced.push(frames[index]);
            }

            frames.length = 0;
            frames.push(...reduced);
        }

        for (const frame of frames) {
            frame.pixels = frame.pixels.map((pixel) => quantizePixel(pixel));
        }

        face = {
            expressions: {
                [ExpressionType.IDLE]: { frames },
            },
        };
    }

    async function onUpload() {
        const path = await open({
            multiple: false,
            directory: false,
            filters: [
                {
                    name: "GIF",
                    extensions: ["gif"],
                },
            ],
        });

        if (!path) {
            return;
        }

        const promise = onUploadFile(path);
        toast.promise(promise, {
            success: "Uploaded image",
            loading: "Uploading image",
            error: "Failed to upload image",
        });
        await promise;
    }

    function mirrorPixelsHorizontally(pixels: Pixel[], width: number): Pixel[] {
        const result: Pixel[] = [];

        for (let y = 0; y < pixels.length; y += width) {
            const row = pixels.slice(y, y + width);
            const mirrored = row.slice().reverse();

            result.push(...row, ...mirrored);
        }

        return result;
    }

    function createCanvas() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas ctx unavailable");

        canvas.width = FACE_PANEL_WIDTH;
        canvas.height = FACE_PANEL_HEIGHT;
        return { canvas, ctx };
    }

    function loadImage(
        raw: Uint8Array<ArrayBuffer>,
    ): Promise<HTMLImageElement> {
        const blob = new Blob([raw]);
        const url = URL.createObjectURL(blob);

        const image = new Image();
        image.src = url;

        return new Promise((resolve, reject) => {
            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject();
            };
            image.onabort = () => {
                URL.revokeObjectURL(url);
                reject();
            };
        });
    }

    function onChangeFrames(action: (frames: FaceFrame[]) => FaceFrame[]) {
        if (!face) return;

        const expressionType = ExpressionType.IDLE;
        const currentFrames = face.expressions[expressionType]?.frames ?? [];
        const newFrames = action(currentFrames);

        face = {
            ...face,
            expressions: {
                ...face.expressions,
                [expressionType]: {
                    frames: newFrames,
                },
            },
        };
    }
</script>

<div class="container">
    <PageHeading name="Upload GIF">
        {#snippet actions()}
            {#if face}
                <button
                    class="btn btn--primary"
                    onclick={() => {
                        if (!face) return;
                        const writePromise = writeFace(face);
                        toast.promise(writePromise, {
                            loading: "Sending face...",
                            success: "Sent face to controller!",
                            error: toastErrorMessage("Failed to send face"),
                        });
                    }}
                >
                    Send
                </button>

                <button
                    class="btn"
                    onclick={() => {
                        face = null;
                    }}
                >
                    Back
                </button>
            {:else}
                <a class="btn" href="/oneshot">Back</a>
            {/if}
        {/snippet}
    </PageHeading>

    {#if face}
        <ExpressionEditor
            expression={face.expressions[ExpressionType.IDLE]!}
            {onChangeFrames}
        />
    {:else}
        <button class="btn btn--span btn--large" onclick={onUpload}>
            Upload Image
        </button>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        height: 100%;
        overflow: hidden;
    }
</style>
