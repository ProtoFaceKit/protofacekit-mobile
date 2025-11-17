import type { Point } from "$lib/types/math";

interface FaceRenderControlsProps {
    /** Canvas to attach the controls to */
    canvas: HTMLCanvasElement;

    /** Maximum camera angle in radians */
    maxCameraAngle: number;

    /** Getter for the current camera position */
    getCameraX(): number;
}

export interface FaceRenderControls {
    /** Getter for the last time the controls were interacted with */
    lastInteractionTime: number;

    /** Getter for the current camera position */
    userCameraX: number;

    /** Cleanup function */
    cleanup: VoidFunction;
}

export enum FaceRenderControlsState {
    // Controls are idle
    IDLE,
    // Dragging has started but horizontal movement is not detected
    STARTED,
    // Horizontal movement detected and controls are active
    DRAGGING,
}

/**
 * Creates the controls for the face 3D render. These controls
 * allow grabbing and moving the 3D render horizontally with
 * both desktop and touch controls
 *
 * @returns Cleanup function to call on unmount
 */
export default function faceRenderControls({
    canvas,
    maxCameraAngle,
    getCameraX,
}: FaceRenderControlsProps): FaceRenderControls {
    let state: FaceRenderControlsState = FaceRenderControlsState.IDLE;
    let lastInteractionTime: number = 0;

    let start: Point = { x: 0, y: 0 };
    let startCameraX: number = 0;
    let userCameraX: number = 0;

    function onDragStart(event: Event, clientX: number, clientY: number) {
        event.preventDefault();

        state = FaceRenderControlsState.STARTED;

        start = { x: clientX, y: clientY };
        startCameraX = getCameraX();

        canvas.style.cursor = "grabbing";
    }

    function onDragMove(event: Event, clientX: number, clientY: number) {
        // Ignore drag events when not dragging
        if (state < FaceRenderControlsState.STARTED) {
            return;
        }

        const deltaX = clientX - start.x;
        const deltaY = clientY - start.y;

        // Only prevent default if horizontal movement is greater than vertical
        if (
            state == FaceRenderControlsState.STARTED &&
            Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > 10
        ) {
            state = FaceRenderControlsState.DRAGGING;
        }

        if (state === FaceRenderControlsState.DRAGGING) {
            event.preventDefault();

            const adjustedDeltaX = deltaX * 0.01;
            const newCameraX = startCameraX - adjustedDeltaX;

            // Clamp the camera position based on max angle
            const radius = 1.5;
            const maxX = Math.sin(maxCameraAngle) * radius;
            userCameraX = Math.max(-maxX, Math.min(maxX, newCameraX));

            lastInteractionTime = Date.now();
        }
    }

    function onDragEnd() {
        canvas.style.cursor = "grab";
        state = FaceRenderControlsState.IDLE;
    }

    function onPointerDown(event: PointerEvent) {
        if (event.pointerType === "touch") {
            return;
        }

        onDragStart(event, event.clientX, event.clientY);
    }

    function onPointerMove(event: PointerEvent) {
        if (event.pointerType === "touch") return;
        onDragMove(event, event.clientX, event.clientY);
    }

    function onTouchStart(event: TouchEvent) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            onDragStart(event, touch.clientX, touch.clientY);
        }
    }

    function onTouchMove(event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        onDragMove(event, touch.clientX, touch.clientY);
    }

    function onPointerUp(event: PointerEvent) {
        if (event.pointerType === "touch") return;
        onDragEnd();
    }

    function onTouchEnd() {
        onDragEnd();
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });

    canvas.style.cursor = "grab";

    return {
        get lastInteractionTime() {
            return lastInteractionTime;
        },
        get userCameraX() {
            return userCameraX;
        },
        cleanup: () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointerleave", onPointerUp);

            canvas.removeEventListener("touchstart", onTouchStart);
            canvas.removeEventListener("touchmove", onTouchMove);
            canvas.removeEventListener("touchend", onTouchEnd);
            canvas.removeEventListener("touchcancel", onTouchEnd);
        },
    };
}
