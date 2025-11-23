<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";
    import { FACE_PANEL_HEIGHT, FACE_PANEL_WIDTH } from "$lib/constants";
    import {
        ALL_EXPRESSIONS,
        ExpressionType,
        type Face,
        type FaceExpression,
        type FaceFrame,
        type Pixel,
    } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { applyPixelAdjustments, quantizePixel } from "$lib/utils/image";
    import { open } from "@tauri-apps/plugin-dialog";
    import { readFile } from "@tauri-apps/plugin-fs";
    import { toast } from "svelte-sonner";

    let facePixels: Pixel[] | null = $state(null);

    let gamma = $state(1.5);
    let brightness = $state(1.0);

    async function onUploadFile(path: string) {
        const raw = await readFile(path);
        const image = await loadImage(raw);

        const { canvas, ctx } = createCanvas();

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

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

        let expressions: Partial<Record<ExpressionType, FaceExpression>> = {};
        for (const expressionType of ALL_EXPRESSIONS) {
            expressions[expressionType] = {
                frames: [{ duration: 255, pixels: mirroredPixels }],
            };
        }

        facePixels = mirroredPixels.map((pixel) => quantizePixel(pixel));
    }

    const adjustedPixels = $derived.by(() => {
        if (!facePixels) return null;
        return applyPixelAdjustments(facePixels, gamma, brightness);
    });

    async function onUpload() {
        const path = await open({
            multiple: false,
            directory: false,
            filters: [
                {
                    name: "Image",
                    extensions: ["png", "svg", "jpeg", "jpg", "webp"],
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
</script>

<div class="container">
    <PageHeading name="Upload Image">
        {#snippet actions()}
            <a class="btn" href="/">Back</a>
        {/snippet}
    </PageHeading>

    <div class="links">
        {#if adjustedPixels}
            <FaceRender3D pixels={adjustedPixels} />

            <label for="gamma">Gamma</label>
            <input
                id="gamma"
                type="number"
                bind:value={gamma}
                min={0.1}
                max={3.0}
                step={0.1}
            />
            <label for="brightness">Brightness</label>
            <input
                id="brightness"
                type="number"
                bind:value={brightness}
                min={0.1}
                max={1.0}
                step={0.1}
            />

            <button
                class="btn btn--span btn--large btn--primary"
                onclick={() => {
                    if (!adjustedPixels) return;
                    const writePromise = writeFace({
                        expressions: {
                            [ExpressionType.IDLE]: {
                                frames: [
                                    {
                                        duration: 255,
                                        pixels: adjustedPixels,
                                    },
                                ],
                            },
                        },
                    });
                    toast.promise(writePromise, {
                        loading: "Sending face...",
                        success: "Sent face to controller!",
                        error: toastErrorMessage("Failed to send face"),
                    });
                }}
            >
                Send
            </button>
        {/if}

        <button class="btn btn--span btn--large" onclick={onUpload}>
            Upload Image
        </button>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        height: 100%;
        overflow: hidden;
    }

    .links {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        padding: 1rem;
    }
</style>
