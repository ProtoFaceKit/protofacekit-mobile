<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import SolarPaintRollerBoldDuotone from "~icons/solar/paint-roller-bold-duotone";
    import SolarEraserBoldDuotone from "~icons/solar/eraser-bold-duotone";
    import SolarMaximizeBold from "~icons/solar/maximize-bold";
    import SolarCopyBoldDuotone from "~icons/solar/copy-bold-duotone";
    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";
    import SolarMirrorLeftBold from "~icons/solar/mirror-left-bold";
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
    import { createFrameEditorGestures } from "$lib/utils/frameEditorGestures";
    import ColorPicker from "svelte-awesome-color-picker";
    const LED_SCALE = 12;

    interface Props {
        frame: FaceFrame;

        onDelete: VoidFunction;
        onDuplicate: VoidFunction;
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
        onDuplicate,
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
            console.log(frame, faceCanvases);

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
        const pixels: [number, number, number][] = Array.from(
            { length: FACE_PANEL_TOTAL_PIXELS },
            () => [0, 0, 0],
        );
        return pixels;
    }

    function createFaceCanvas(): FaceCanvas {
        const canvas = document.createElement("canvas");

        canvas.width = FACE_PANEL_WIDTH * LED_SCALE;
        canvas.height = FACE_PANEL_HEIGHT * LED_SCALE;

        canvas.style.display = "block";
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;

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
        row = Math.floor(row);
        col = Math.floor(col);

        const centerX = col * LED_SCALE + LED_SCALE / 2;
        const centerY = row * LED_SCALE + LED_SCALE / 2;

        ctx.fillStyle = `rgb(${r},${g},${b})`;

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

        for (const { canvas } of faceCanvases) {
            container.appendChild(canvas);
        }

        return () => {
            for (const { canvas } of faceCanvases) {
                container.removeChild(canvas);
            }

            cleanupGestures();
        };
    });
</script>

<div class="container">
    <div class="actions">
        <button class="action" onclick={onToggleFullscreen}>
            <SolarMaximizeBold />
        </button>
        <button class="action" onclick={onDuplicate}>
            <SolarCopyBoldDuotone />
        </button>
        <button class="action" onclick={onDelete}>
            <SolarTrashBin2BoldDuotone />
        </button>
    </div>

    <div class="canvas" bind:this={facesContainer}>
        <div class="panning" bind:this={panningContainer}></div>
    </div>

    <div class="toolbar">
        <div class="toolbar-group">
            <button
                class="toolbar-button"
                class:toolbar-button--active={!erase}
                onclick={() => (erase = false)}
            >
                <SolarPaintRollerBoldDuotone />
            </button>

            <button
                class="toolbar-button"
                class:toolbar-button--active={erase}
                onclick={() => (erase = true)}
            >
                <SolarEraserBoldDuotone />
            </button>
        </div>

        <div class="toolbar-group">
            <button
                class="toolbar-button"
                class:toolbar-button--active={mirror}
                onclick={() => (mirror = !mirror)}
            >
                <SolarMirrorLeftBold />
            </button>
        </div>

        {#if !erase}
            <div class="toolbar-group">
                <div class="color-picker">
                    <ColorPicker
                        rgb={paintColor}
                        onInput={(color) => {
                            if (color.rgb) paintColor = color.rgb;
                        }}
                        position="responsive"
                        label={""}
                        isAlpha={false}
                    />
                </div>
            </div>
        {/if}

        <div class="toolbar-group">
            <div class="brush-size">
                <span class="brush-size-label">Brush Size</span>

                <input
                    type="range"
                    min="1"
                    max="10"
                    bind:value={paintSize}
                    class="slider"
                />
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        position: relative;
        display: flex;
        flex-flow: column;
        height: 100%;
    }

    .canvas {
        border-top: 1px solid white;
        flex: auto;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        z-index: 0;
    }

    .canvas:global(> .panning > canvas) {
        border: 2px solid white;
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

        position: absolute;
        will-change: transform;
    }

    .actions {
        position: absolute;
        top: 1px;
        right: 0;
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        align-items: center;
        justify-self: flex-end;
        align-items: flex-end;
        z-index: 1;
    }

    .action {
        background-color: #222;
        color: #fff;
        border: none;
        height: 3rem;
    }

    .toolbar {
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        align-items: center;
        background-color: #111;
        width: 100%;
        justify-content: space-between;
    }

    .toolbar-group {
        display: flex;
        height: 3rem;
        align-items: center;
        border: 1px solid #222;
    }

    .toolbar-button {
        background-color: #222;
        color: #fff;
        border: none;
        height: 100%;
    }

    .toolbar-button--active {
        background-color: #622d2d;
    }

    .color-picker {
        display: flex;
        width: 100%;
        align-items: center;
        flex-shrink: 0;
    }

    .brush-size-label {
        margin-left: 0.5rem;
    }

    .brush-size {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 1rem;
    }
</style>
