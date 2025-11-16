<script lang="ts">
    import { writeFace } from "$lib/ble";
    import { FACE_PANEL_TOTAL_WIDTH } from "$lib/constants";
    import { ExpressionType, type Face, type FaceFrame } from "$lib/types/data";
    import { copyToClipboard } from "$lib/utils/clipboard";
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
    let erase = $state(false);

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

    const faceCanvases: FaceCanvas[] = [createFaceCanvas(), createFaceCanvas()];

    let facesContainer: HTMLDivElement | undefined = $state();

    interface LastPaintedCell {
        faceIndex: number;
        col: number;
        row: number;
    }

    onMount(() => {
        if (!facesContainer) return;

        let drawing = false;

        let lastPaintedCell: LastPaintedCell | null = null;

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

            // Check if we're painting the same cell as last time
            if (
                lastPaintedCell &&
                lastPaintedCell.faceIndex === faceTargetIndex &&
                lastPaintedCell.col === col &&
                lastPaintedCell.row === row
            ) {
                return; // Skip if same cell
            }

            lastPaintedCell = { faceIndex: faceTargetIndex, col, row };
            paintWithBrush(faceTargetIndex, col, row);
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
        const wrappers: HTMLDivElement[] = [];

        for (const { canvas } of faceCanvases) {
            canvas.classList.add("face-canvas");
            canvas.addEventListener("pointerdown", onPointerDown);
            canvas.addEventListener("pointermove", onPointerMove);
            canvas.addEventListener("pointerup", onPointerUp);
            canvas.addEventListener("pointerout", onPointerUp);
            canvas.addEventListener("pointercancel", onPointerUp);
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
                canvas.removeEventListener("pointerdown", onPointerDown);
                canvas.removeEventListener("pointermove", onPointerMove);
                canvas.removeEventListener("pointerup", onPointerUp);
                canvas.removeEventListener("pointerout", onPointerUp);
                canvas.removeEventListener("pointercancel", onPointerUp);
            }

            for (const wrapper of wrappers) {
                container.removeChild(wrapper);
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

    function clearCanvas() {
        pixels = createInitialPixels();
        for (const { canvas, ctx } of faceCanvases) {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
</script>

<div class="container">
    <div bind:this={facesContainer} class="faces-container"></div>

    <div class="controls">
        <div class="control-group">
            <h3>Tools</h3>
            <button
                class="button"
                class:active={!erase}
                onclick={() => (erase = false)}
            >
                Brush
            </button>
            <button
                class="button"
                class:active={erase}
                onclick={() => (erase = true)}
            >
                Eraser
            </button>
        </div>

        <div class="control-group">
            <h3>Options</h3>
            <label class="checkbox-label">
                <input type="checkbox" bind:checked={mirror} />
                <span>Mirror Mode</span>
            </label>

            <label class="slider-label">
                <span>Brush Size: {paintSize}</span>
                <input
                    type="range"
                    min="1"
                    max="10"
                    bind:value={paintSize}
                    class="slider"
                />
            </label>
        </div>

        {#if !erase}
            <div class="control-group">
                <h3>Color</h3>
                <ColorPicker
                    rgb={paintColor}
                    onInput={(color) => {
                        if (color.rgb) paintColor = color.rgb;
                    }}
                    position="responsive"
                    label={"Paint Color"}
                    isAlpha={false}
                />
            </div>
        {/if}

        <div class="control-group">
            <h3>Actions</h3>
            <button class="action-btn" onclick={clearCanvas}>
                Clear Canvas
            </button>
            <button class="action-btn" onclick={onCopy}>Copy Pattern</button>
            <button class="action-btn" onclick={flashTest}>
                Flash to Device
            </button>
            <button class="action-btn" onclick={testFace}>Test Face</button>
        </div>
    </div>

    {#if face !== null}
        <div class="preview">
            <h3>Preview</h3>
            <FaceRenderer {face}></FaceRenderer>
        </div>
    {/if}
</div>

<style>
    .container {
        padding: 1rem;
        max-width: 100%;
        height: 100vh;
        overflow: auto;
    }

    .faces-container {
        overflow: auto;
        gap: 1rem;
        display: flex;
    }

    .faces-container:global(> .canvas-container > .face-canvas) {
        border: 1px solid white;
    }

    .faces-container:global(> .canvas-container) {
        flex-shrink: 0;
        flex-grow: 0;
    }

    .controls {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 600px;
    }

    .control-group {
        padding: 1rem;
        border-radius: 8px;
    }

    .control-group h3 {
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        color: #fff;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.5rem;
        user-select: none;
    }

    .checkbox-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .slider-label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
    }

    .button {
        display: block;
        width: 100%;
        margin-top: 1rem;
        background-color: #222;
        color: #fff;
        font-weight: 500;
        border: none;
        border-radius: 0.4rem;
        padding: 0.5em 1em;
        cursor: pointer;
    }
</style>
