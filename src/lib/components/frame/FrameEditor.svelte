<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import SolarPaintRollerBoldDuotone from "~icons/solar/paint-roller-bold-duotone";
    import SolarEraserBoldDuotone from "~icons/solar/eraser-bold-duotone";
    import SolarMaximizeBold from "~icons/solar/maximize-bold";

    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";
    import type { RgbColor } from "$lib/types/color";
    import {
        FACE_PANEL_COUNT,
        FACE_PANEL_HEIGHT,
        FACE_PANEL_TOTAL_PIXELS,
        FACE_PANEL_TOTAL_WIDTH,
        FACE_PANEL_WIDTH,
    } from "$lib/constants";
    import { useDebounce, watch } from "runed";
    import { onMount } from "svelte";
    import { distance, midpoint, type Point } from "$lib/types/math";
    import { createFrameEditorGestures } from "$lib/utils/frameEditorGestures";

    const LED_SCALE = 12;

    interface Props {
        frame: FaceFrame;

        onDelete: VoidFunction;
        onToggleFullscreen: VoidFunction;

        onChangePixels: (pixels: [number, number, number][]) => void;
    }

    interface FaceCanvas {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
    }

    const {
        frame,
        onChangePixels: setFramePixelsRoot,
        onDelete,
        onToggleFullscreen,
    }: Props = $props();

    const setFramePixels = useDebounce(setFramePixelsRoot, 300);

    let pixels = $state(createEmptyPixels());
    let paintColor: RgbColor = $state({ r: 255, g: 0, b: 0, a: 1 });
    let paintSize = $state(1);
    let mirror = $state(false);
    let erase = $state(false);

    let facesContainer: HTMLDivElement | undefined = $state();
    let panningContainer: HTMLDivElement | undefined = $state();

    const faceCanvases: FaceCanvas[] = [createFaceCanvas(), createFaceCanvas()];

    // Copy the pixels from the frame when they change
    watch(
        () => frame,
        (frame) => {
            for (const { canvas, ctx } of faceCanvases) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            for (let i = 0; i < frame.pixels.length; i += 1) {
                const [r, g, b] = frame.pixels[i];

                const row = i / FACE_PANEL_TOTAL_WIDTH;
                const col = i % FACE_PANEL_TOTAL_WIDTH;
                const secondFace = col >= FACE_PANEL_WIDTH;

                const face = faceCanvases[secondFace ? 1 : 0];

                drawLED(
                    face.ctx,
                    col - (secondFace ? FACE_PANEL_WIDTH : 0),
                    row,
                    r,
                    g,
                    b,
                );
            }

            pixels = frame.pixels.map(([r, g, b]) => [r, g, b]);
        },
    );

    function createEmptyPixels(): [number, number, number][] {
        const pixels: [number, number, number][] = [];
        pixels.fill([0, 0, 0], 0, FACE_PANEL_TOTAL_PIXELS);
        return pixels;
    }

    function createFaceCanvas(): FaceCanvas {
        const canvas = document.createElement("canvas");

        canvas.width = FACE_PANEL_WIDTH * LED_SCALE;
        canvas.height = FACE_PANEL_HEIGHT * LED_SCALE;

        canvas.style.display = "block";
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;

        // Optional: remove aspect-ratio
        canvas.style.aspectRatio = "auto";
        canvas.style.flexShrink = "0";

        // Prevent scrolling on touch
        canvas.style.touchAction = "none";

        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("missing canvas 2d context");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return { canvas, ctx };
    }

    function drawLED(
        ctx: CanvasRenderingContext2D,
        col: number,
        row: number,
        r: number,
        g: number,
        b: number,
    ) {
        const centerX = col * LED_SCALE + LED_SCALE / 2;
        const centerY = row * LED_SCALE + LED_SCALE / 2;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = r === 0 && g === 0 && b === 0 ? 0 : 3;

        ctx.beginPath();
        ctx.arc(centerX, centerY, LED_SCALE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
    }

    function paintPixel(
        faceIndex: number,
        col: number,
        row: number,
        r: number,
        g: number,
        b: number,
    ) {
        if (
            col < 0 ||
            col >= FACE_PANEL_WIDTH ||
            row < 0 ||
            row >= FACE_PANEL_HEIGHT
        )
            return;

        const pixelIndex =
            row * FACE_PANEL_TOTAL_WIDTH + faceIndex * FACE_PANEL_WIDTH + col;
        pixels[pixelIndex] = [r, g, b];
        setFramePixels(pixels);

        const { ctx } = faceCanvases[faceIndex];
        drawLED(ctx, col, row, r, g, b);
    }

    function paintWithBrush(
        faceIndex: number,
        centerCol: number,
        centerRow: number,
    ) {
        const { r, g, b } = erase ? { r: 0, g: 0, b: 0 } : paintColor;
        console.log(paintSize);
        // Calculate radius: size 1 = radius 0, size 2 = radius 0.5, size 3 = radius 1, etc.
        const radius = (paintSize - 1) / 2;
        const radiusCeil = Math.ceil(radius);

        for (let dy = -radiusCeil; dy <= radiusCeil; dy++) {
            for (let dx = -radiusCeil; dx <= radiusCeil; dx++) {
                const col = centerCol + dx;
                const row = centerRow + dy;

                // Circular brush - distance from center
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius + 0.5) {
                    // Add 0.5 to include edge pixels
                    paintPixel(faceIndex, col, row, r, g, b);

                    if (mirror) {
                        const otherIndex = faceIndex === 0 ? 1 : 0;
                        const otherCol = FACE_PANEL_WIDTH - 1 - col;
                        paintPixel(otherIndex, otherCol, row, r, g, b);
                    }
                }
            }
        }
    }

    function clearCanvas() {
        pixels = createEmptyPixels();
        setFramePixelsRoot(pixels);

        for (const { canvas, ctx } of faceCanvases) {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    onMount(() => {
        if (!panningContainer || !facesContainer) return;

        const paint = (
            canvas: HTMLCanvasElement,
            row: number,
            column: number,
        ) => {
            const faceIndex = faceCanvases.findIndex(
                (fc) => fc.canvas === canvas,
            );
            if (faceIndex !== -1) {
                paintWithBrush(faceIndex, column, row);
            }
        };

        const cleanupGestures = createFrameEditorGestures({
            ledScale: LED_SCALE,
            panningContainer: panningContainer,
            wrapperContainer: facesContainer,
            paint,
            thresholds: {
                // Milliseconds
                draw: 80,
                // Pixels
                pinch: 10,
                drag: 10,
            },
        });

        const container = panningContainer;
        const wrappers: HTMLDivElement[] = [];

        for (const { canvas } of faceCanvases) {
            canvas.classList.add("face-canvas");
            const wrapper = document.createElement("div");
            wrapper.classList.add("canvas-container");
            wrapper.appendChild(canvas);
            container.appendChild(wrapper);
            wrappers.push(wrapper);

            wrapper.style.display = "block";
            wrapper.style.width = `${FACE_PANEL_WIDTH * LED_SCALE}px`;
            wrapper.style.height = `${FACE_PANEL_HEIGHT * LED_SCALE}px`;
        }

        return () => {
            for (const { canvas } of faceCanvases) {
                canvas.classList.remove("face-canvas");
            }

            for (const wrapper of wrappers) {
                container.removeChild(wrapper);
            }

            cleanupGestures();
        };
    });
</script>

<div class="container">
    <div class="actions">
        <button onclick={onDelete}>
            <SolarTrashBin2BoldDuotone />
        </button>
        <button onclick={onToggleFullscreen}>
            <SolarMaximizeBold />
        </button>
    </div>

    <div class="canvas" bind:this={facesContainer}>
        <div class="panning" bind:this={panningContainer}></div>
    </div>

    <div class="toolbar">
        <button>
            <SolarPaintRollerBoldDuotone />
        </button>

        <button>
            <SolarEraserBoldDuotone />
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

    .canvas {
        flex: auto;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
    }

    .panning {
        position: absolute;
        left: 0;
        top: 0;

        display: flex;
        flex-direction: row;
        gap: 20px;

        transform-origin: 0 0;
        touch-action: none;
    }

    .actions {
        display: flex;
        width: 100%;
    }

    .toolbar {
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        align-items: center;
    }
</style>
