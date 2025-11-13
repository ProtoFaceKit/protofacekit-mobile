<script lang="ts">
    import { discoverController, writeFace } from "$lib/ble";
    import { FACE_PANEL_TOTAL_WIDTH } from "$lib/constants";
    import { ExpressionType, type Face, type FaceFrame } from "$lib/types/data";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { connect } from "@mnlphlp/plugin-blec";
    import { onMount } from "svelte";
    import ColorPicker from "svelte-awesome-color-picker";
    import FaceRenderer from "./FaceRenderer.svelte";

    const FACE_PANEL_WIDTH = 64;
    const FACE_PANEL_HEIGHT = 32;
    const LED_SCALE = 12;

    interface FaceCanvas {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
    }

    let pixels: [number, number, number][] = $state(createInitialPixels());

    function createInitialPixels() {
        const pixels: [number, number, number][] = [];

        for (let y = 0; y < FACE_PANEL_HEIGHT; y += 1) {
            for (let x = 0; x < FACE_PANEL_TOTAL_WIDTH; x += 1) {
                pixels.push([0, 0, 0]);
            }
        }

        return pixels;
    }

    let paintColor: RgbColor = $state({ r: 255, g: 0, b: 0, a: 1 });
    let paintSize = $state(1);
    let mirror = $state(false);

    type RgbColor = {
        r: number;
        g: number;
        b: number;
        a: number;
    };

    function createFaceCanvas(): FaceCanvas {
        const canvas = document.createElement("canvas");
        canvas.width = FACE_PANEL_WIDTH * LED_SCALE;
        canvas.height = FACE_PANEL_HEIGHT * LED_SCALE;

        canvas.style.width = `${FACE_PANEL_WIDTH * LED_SCALE}px`;
        canvas.style.height = `${FACE_PANEL_HEIGHT * LED_SCALE}px`;
        // canvas.style.imageRendering = "pixelated";

        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("missing canvas 2d context");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return { canvas, ctx };
    }

    const faceCanvases: FaceCanvas[] = [createFaceCanvas(), createFaceCanvas()];

    let facesContainer: HTMLDivElement | undefined = $state();

    onMount(() => {
        if (!facesContainer) return;

        let drawing = false;

        const paintOnCanvas = (event: PointerEvent) => {
            const target = event.target;
            if (target === null) return;

            const faceTargetIndex = faceCanvases.findIndex(
                (face) => face.canvas === target,
            );
            if (faceTargetIndex === -1) return;

            const faceTarget = faceCanvases[faceTargetIndex];

            const { canvas, ctx } = faceTarget;
            const rect = canvas.getBoundingClientRect();

            // Pointer relative to canvas
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Map to grid cell
            const col = Math.floor(x / LED_SCALE);
            const row = Math.floor(y / LED_SCALE);

            // Center of the LED cell
            const centerX = col * LED_SCALE + LED_SCALE / 2;
            const centerY = row * LED_SCALE + LED_SCALE / 2;

            const { r, g, b } = paintColor;

            pixels[
                row * FACE_PANEL_TOTAL_WIDTH + // jump to the correct row
                    faceTargetIndex * FACE_PANEL_WIDTH + // jump to correct canvas in row
                    col
            ] = [r, g, b];

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.shadowBlur = 3;

            ctx.beginPath();
            ctx.arc(centerX, centerY, LED_SCALE / 2 - 1, 0, Math.PI * 2);
            ctx.fill();

            if (mirror) {
                const otherIndex = faceTargetIndex === 0 ? 1 : 0;
                const { ctx } = faceCanvases[otherIndex];
                const otherCol = FACE_PANEL_WIDTH - 1 - col;
                const otherRow = row;

                const centerX = otherCol * LED_SCALE + LED_SCALE / 2;
                const centerY = otherRow * LED_SCALE + LED_SCALE / 2;

                pixels[
                    otherRow * FACE_PANEL_TOTAL_WIDTH + // jump to the correct row
                        otherIndex * FACE_PANEL_WIDTH + // jump to correct canvas in row
                        otherCol
                ] = [r, g, b];

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.shadowColor = `rgb(${r},${g},${b})`;
                ctx.shadowBlur = 3;

                ctx.beginPath();
                ctx.arc(centerX, centerY, LED_SCALE / 2 - 1, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const onPointerDown = (event: PointerEvent) => {
            drawing = true;
            paintOnCanvas(event);
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!drawing) return;
            paintOnCanvas(event);
        };

        const onPointerUp = (event: PointerEvent) => {
            drawing = false;
        };

        const container = facesContainer;
        for (const { canvas } of faceCanvases) {
            canvas.addEventListener("pointerdown", onPointerDown);
            canvas.addEventListener("pointermove", onPointerMove);
            canvas.addEventListener("pointerup", onPointerUp);
            container.appendChild(canvas);
        }

        return () => {
            for (const { canvas } of faceCanvases) {
                canvas.removeEventListener("pointerdown", onPointerDown);
                canvas.removeEventListener("pointermove", onPointerMove);
                canvas.removeEventListener("pointerup", onPointerUp);
                container.removeChild(canvas);
            }
        };
    });

    function onCopy() {
        const output = JSON.stringify({
            pixels: pixels,
        });
        copyToClipboard(output);
    }

    async function flashTest() {
        const controller = await discoverController();
        if (controller === null) return;

        console.log("resolve", controller);
        await connect(controller.address, () => {});
        console.log(pixels);
        writeFace({
            expressions: {
                [ExpressionType.IDLE]: {
                    frames: [
                        {
                            pixels: pixels,
                            duration: 255,
                        },
                    ],
                },
            },
        });
    }

    let face: Face | null = $state(null);

    function testFace() {
        face = {
            expressions: {
                [ExpressionType.IDLE]: {
                    frames: [
                        {
                            pixels: [...pixels],
                            duration: 255,
                        },
                    ],
                },
            },
        };
    }
</script>

<div bind:this={facesContainer} class="faces-container"></div>

<label for="">Mirror <input type="checkbox" bind:checked={mirror} /> </label>
<label for=""
    >Brush Size <input
        type="number"
        min="1"
        max="10"
        bind:value={paintSize}
    /></label
>

<ColorPicker
    rgb={paintColor}
    onInput={(color) => {
        if (color.rgb) paintColor = color.rgb;
    }}
    position="responsive"
    label={"Paint Color"}
    isAlpha={false}
/>

<button onclick={onCopy}>Copy Pattern</button>

<button onclick={flashTest}>Flash</button>
<button onclick={testFace}>Test Face</button>

{#if face !== null}
    <FaceRenderer {face}></FaceRenderer>
{/if}

<style>
    .faces-container {
        display: flex;
        gap: 1rem;
    }
</style>
