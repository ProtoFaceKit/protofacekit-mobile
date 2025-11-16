import { FACE_PANEL_TOTAL_WIDTH } from "$lib/constants";
import { distance, midpoint, type Point } from "$lib/types/math";

interface CreateFrameEditorGestures {
    ledScale: number;

    thresholds: {
        draw: number;
        pinch: number;
        drag: number;
    };

    wrapperContainer: HTMLElement;
    panningContainer: HTMLElement;

    paint: (canvas: HTMLCanvasElement, row: number, column: number) => void;
}

interface LastPaintedCell {
    canvas: HTMLCanvasElement;
    col: number;
    row: number;
}

export function createFrameEditorGestures({
    ledScale,
    thresholds,
    wrapperContainer,
    panningContainer,
    paint,
}: CreateFrameEditorGestures) {
    let gesture: "paint" | "pan" | "zoom" | null = null;
    let pendingPaintTimeout: ReturnType<typeof setTimeout> | null = null;

    let lastPoint: Point | null = null;

    let startDist = 0;
    let startMid: Point | null = null;

    let currentScale =
        // Fit the scale to the container scale
        wrapperContainer.clientWidth / (FACE_PANEL_TOTAL_WIDTH * ledScale);
    let baseScale = 1;

    let translateX = 0;
    let translateY = 0;

    let lastPaintedCell: LastPaintedCell | null = null;

    function applyTransform() {
        if (!panningContainer) return;
        panningContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }

    function screenToCanvas(x: number, y: number, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();

        // Convert screen to unscaled container coordinates
        const containerX = (x - translateX - rect.left) / currentScale;
        const containerY = (y - translateY - rect.top) / currentScale;

        return { x: containerX, y: containerY };
    }

    /** Pointer and wheel events (Desktop) */

    function onWheel(event: WheelEvent) {
        event.preventDefault();

        const zoomIntensity = 0.1;
        currentScale += (event.deltaY < 0 ? 1 : -1) * zoomIntensity;
        currentScale = Math.min(Math.max(currentScale, 0.2), 4);

        applyTransform();
    }

    function onPointerDown(event: PointerEvent) {
        if (event.pointerType === "touch") return;

        if (event.target instanceof HTMLCanvasElement) {
            gesture = "paint";
        } else {
            gesture = "pan";
            lastPoint = { x: event.clientX, y: event.clientY };
        }
    }

    function onPointerMove(event: PointerEvent) {
        // Ignore pointer events on mobile
        if (event.pointerType === "touch") return;

        if (gesture === "pan" && lastPoint) {
            const dx = event.clientX - lastPoint.x;
            const dy = event.clientY - lastPoint.y;

            translateX += dx;
            translateY += dy;

            lastPoint = { x: event.clientX, y: event.clientY };
            applyTransform();
            return;
        }

        if (gesture === "paint" && event.target instanceof HTMLCanvasElement) {
            onMovePaint(event.target, event.clientX, event.clientY);
        }
    }

    function onPointerUp(event: PointerEvent) {
        // Ignore pointer events on mobile
        if (event.pointerType === "touch") return;

        if (pendingPaintTimeout !== null) {
            clearTimeout(pendingPaintTimeout);
        }

        gesture = null;
        lastPoint = null;
    }

    /** Touch events (Mobile) */

    function onTouchStart(event: TouchEvent) {
        // Two finger action
        if (event.touches.length === 2) {
            // Cancel painting before anything starts
            if (pendingPaintTimeout !== null) {
                clearTimeout(pendingPaintTimeout);
            }

            const p1 = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
            const p2 = {
                x: event.touches[1].clientX,
                y: event.touches[1].clientY,
            };

            startDist = distance(p1, p2);
            startMid = midpoint(p1, p2);

            baseScale = currentScale;
            return;
        }

        if (
            event.touches.length === 1 &&
            event.target instanceof HTMLCanvasElement
        ) {
            pendingPaintTimeout = setTimeout(() => {
                if (event.touches.length === 1) {
                    gesture = "paint";
                    const touch = event.touches[0];
                    lastPoint = { x: touch.clientX, y: touch.clientY };
                }
            }, thresholds.draw);
        }
    }

    function onMovePaint(
        canvas: HTMLCanvasElement,
        clientX: number,
        clientY: number,
    ) {
        const point = screenToCanvas(clientX, clientY, canvas);
        const col = Math.floor(point.x / ledScale);
        const row = Math.floor(point.y / ledScale);

        lastPoint = point;

        // Ignore painting the same cell twice
        if (
            lastPaintedCell &&
            lastPaintedCell.canvas === canvas &&
            lastPaintedCell.col === col &&
            lastPaintedCell.row === row
        ) {
            return;
        }

        lastPaintedCell = { canvas, col, row };
        paint(canvas, row, col);
    }

    function onTouchMove(event: TouchEvent) {
        if (gesture === "paint") {
            if (
                event.touches.length !== 1 ||
                !(event.target instanceof HTMLCanvasElement)
            ) {
                return;
            }

            onMovePaint(
                event.target,
                event.touches[0].clientX,
                event.touches[0].clientY,
            );
            return;
        }

        if (event.touches.length !== 2 || !startMid) return;

        const p1 = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
        };
        const p2 = {
            x: event.touches[1].clientX,
            y: event.touches[1].clientY,
        };

        const nowDist = distance(p1, p2);
        const nowMid = midpoint(p1, p2);

        if (!gesture) {
            if (Math.abs(nowDist - startDist) > thresholds.pinch) {
                gesture = "zoom";
            } else if (distance(nowMid, startMid) > thresholds.drag) {
                gesture = "pan";
            } else {
                return; // Ignore jitter
            }
        }

        if (gesture === "zoom") {
            currentScale = baseScale * (nowDist / startDist);
        } else if (gesture === "pan") {
            translateX += nowMid.x - startMid.x;
            translateY += nowMid.y - startMid.y;
        }

        startMid = nowMid;
        applyTransform();
    }

    function onTouchEnd() {
        if (pendingPaintTimeout !== null) {
            clearTimeout(pendingPaintTimeout);
        }
        gesture = null;
        lastPoint = null;
    }

    // Apply initial transform
    applyTransform();

    // Add event listeners
    wrapperContainer.addEventListener("wheel", onWheel, { passive: false });
    wrapperContainer.addEventListener("pointerdown", onPointerDown);
    wrapperContainer.addEventListener("pointermove", onPointerMove);
    wrapperContainer.addEventListener("pointerup", onPointerUp);
    wrapperContainer.addEventListener("pointerleave", onPointerUp);
    wrapperContainer.addEventListener("pointercancel", onPointerUp);
    wrapperContainer.addEventListener("touchstart", onTouchStart, {
        passive: false,
    });
    wrapperContainer.addEventListener("touchmove", onTouchMove, {
        passive: false,
    });
    wrapperContainer.addEventListener("touchend", onTouchEnd);

    return () => {
        wrapperContainer.removeEventListener("wheel", onWheel);
        wrapperContainer.removeEventListener("pointerdown", onPointerDown);
        wrapperContainer.removeEventListener("pointermove", onPointerMove);
        wrapperContainer.removeEventListener("pointerup", onPointerUp);
        wrapperContainer.removeEventListener("pointerleave", onPointerUp);
        wrapperContainer.removeEventListener("pointercancel", onPointerUp);
        wrapperContainer.removeEventListener("touchstart", onTouchStart);
        wrapperContainer.removeEventListener("touchmove", onTouchMove);
        wrapperContainer.removeEventListener("touchend", onTouchEnd);
    };
}
