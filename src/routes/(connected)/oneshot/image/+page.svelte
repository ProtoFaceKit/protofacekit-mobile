<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FacePreview from "$lib/components/face/FacePreview.svelte";
    import {
        FACE_PANEL_HEIGHT,
        FACE_PANEL_TOTAL_WIDTH,
        FACE_PANEL_WIDTH,
    } from "$lib/constants";
    import {
        ALL_EXPRESSIONS,
        ExpressionType,
        type Face,
        type FaceExpression,
        type Pixel,
    } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { open } from "@tauri-apps/plugin-dialog";
    import { readFile } from "@tauri-apps/plugin-fs";
    import { toast } from "svelte-sonner";

    let face: Face | null = $state(null);

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

        face = {
            expressions,
        };
    }

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
    <div class="heading">
        <div class="path">
            <p class="path--segment">Upload Image</p>
        </div>

        <div class="actions">
            <a class="btn" href="/oneshot">Back</a>
        </div>
    </div>

    <div class="links">
        {#if face}
            <FacePreview {face} />

            <button
                class="btn btn--span btn--large btn--primary"
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

    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        margin-bottom: 0.5rem;
        padding: 0 0.5rem;
    }

    .path {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;
        align-items: center;
        flex: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 0.5rem;
    }

    .path--segment {
        color: #999;
        font-size: 1.25rem;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }
</style>
