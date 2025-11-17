<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import FrameTimelineItem from "./FrameTimelineItem.svelte";
    import SolarPlayBold from "~icons/solar/play-bold";
    import SolarPauseBold from "~icons/solar/pause-bold";
    import type { Point } from "$lib/types/math";
    import {
        TimelineDraggingState,
        type TimelineDragging,
    } from "./frameTimelineDragging";
    import { contain } from "three/src/extras/TextureUtils.js";

    interface Props {
        frames: FaceFrame[];
        activeFrameIndex: number;

        onAddFrame: VoidFunction;
        onSelectFrame: (index: number) => void;
        onChangeFrameDuration: (index: number, duration: number) => void;
        onMoveFrame: (fromIndex: number, toIndex: number) => void;

        running: boolean;
        onPlay: VoidFunction;
        onPause: VoidFunction;
    }

    const {
        frames,
        activeFrameIndex,
        onAddFrame,
        onMoveFrame,
        running,
        onPlay,
        onPause,
        onSelectFrame,
        onChangeFrameDuration,
    }: Props = $props();

    let draggingState: TimelineDragging = $state({
        state: TimelineDraggingState.IDLE,
    });

    let framesContainer: HTMLDivElement | undefined = $state();

    const DRAG_DELAY = 100;
    const MOVE_THRESHOLD = 10;
    const EDGE_SCROLL_ZONE = 80;
    const SCROLL_SPEED = 10;

    let start: Point = { x: 0, y: 0 };
    let autoScrollInterval: ReturnType<typeof setInterval> | null = null;

    function onDragStart(
        event: Event,
        clientX: number,
        clientY: number,
        index: number,
    ) {
        start = { x: clientX, y: clientY };
        const timeout = setTimeout(() => {
            if (draggingState.state === TimelineDraggingState.WAITING) {
                event.preventDefault();
                draggingState = {
                    state: TimelineDraggingState.DRAGGING,
                    draggedIndex: index,
                    dragOverIndex: null,
                };
            }
        }, DRAG_DELAY);

        draggingState = { state: TimelineDraggingState.WAITING, timeout };
    }

    function onDragMove(event: Event, clientX: number, clientY: number) {
        const deltaX = Math.abs(clientX - start.x);
        const deltaY = Math.abs(clientY - start.y);

        if (draggingState.state === TimelineDraggingState.WAITING) {
            // Check if movement exceeds threshold (user is scrolling)
            if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                clearTimeout(draggingState.timeout);
                draggingState = { state: TimelineDraggingState.MOVED };
            }
            return;
        }

        event.preventDefault();

        if (draggingState.state === TimelineDraggingState.DRAGGING) {
            const elements =
                framesContainer?.querySelectorAll(".frame-container");

            if (elements) {
                // Update the current dragged over frame
                for (let i = 0; i < elements.length; i += 1) {
                    const element = elements.item(i);
                    const rect = element.getBoundingClientRect();
                    if (clientX >= rect.left && clientX <= rect.right) {
                        draggingState.dragOverIndex = i;
                    }
                }
            }

            checkEdgeScroll(clientX);
        }
    }

    function checkEdgeScroll(clientX: number) {
        if (!framesContainer) return;
        const rect = framesContainer.getBoundingClientRect();
        const leftEdge = rect.left;
        const rightEdge = rect.right;

        // Clear existing auto-scroll
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }

        // Check if near left edge
        if (clientX - leftEdge < EDGE_SCROLL_ZONE) {
            autoScrollInterval = setInterval(() => {
                if (!framesContainer) return;
                framesContainer.scrollLeft -= SCROLL_SPEED;
            }, 16);
        }
        // Check if near or past right edge
        else if (
            rightEdge - clientX < EDGE_SCROLL_ZONE ||
            clientX > rightEdge
        ) {
            autoScrollInterval = setInterval(() => {
                if (!framesContainer) return;
                framesContainer.scrollLeft += SCROLL_SPEED;
            }, 16);
        }
    }

    function onDragEnd() {
        if (draggingState.state === TimelineDraggingState.WAITING) {
            clearTimeout(draggingState.timeout);
        }

        if (
            draggingState.state === TimelineDraggingState.DRAGGING &&
            draggingState.dragOverIndex !== null
        ) {
            onMoveFrame(
                draggingState.draggedIndex,
                draggingState.dragOverIndex,
            );
        }

        draggingState = { state: TimelineDraggingState.IDLE };
    }

    function onTouchStart(event: TouchEvent, index: number) {
        const touch = event.touches[0];
        onDragStart(event, touch.clientX, touch.clientY, index);
    }

    function onTouchMove(event: TouchEvent) {
        const touch = event.touches[0];
        onDragMove(event, touch.clientX, touch.clientY);
    }

    function onTouchEnd() {
        onDragEnd();
    }

    function onPointerDown(event: PointerEvent, index: number) {
        if (event.pointerType === "touch") return;
        onDragStart(event, event.clientX, event.clientY, index);
    }

    function onPointerMove(event: PointerEvent) {
        if (event.pointerType === "touch") return;
        onDragMove(event, event.clientX, event.clientY);
    }

    function onPointerUp(event: PointerEvent) {
        if (event.pointerType === "touch") return;
        onDragEnd();
    }
</script>

<div
    class="timeline"
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointerout={onPointerUp}
    onpointercancel={onPointerUp}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
    ontouchcancel={onTouchEnd}
>
    <div
        bind:this={framesContainer}
        class="frames"
        class:frames--dragging={draggingState.state ===
            TimelineDraggingState.DRAGGING}
    >
        {#each frames as frame, index (index)}
            <div
                class="frame-container"
                class:dragging={draggingState.state ===
                    TimelineDraggingState.DRAGGING &&
                    draggingState.draggedIndex === index}
                class:drag-over={draggingState.state ===
                    TimelineDraggingState.DRAGGING &&
                    draggingState.draggedIndex !== index &&
                    draggingState.dragOverIndex === index}
                onpointerdown={(event) => onPointerDown(event, index)}
                ontouchstart={(event) => onTouchStart(event, index)}
                role="button"
                tabindex="0"
            >
                <FrameTimelineItem
                    {frame}
                    active={index === activeFrameIndex}
                    onSelect={() => onSelectFrame(index)}
                    onChangeDuration={(duration) => {
                        onChangeFrameDuration(index, duration);
                    }}
                />
            </div>
        {/each}
    </div>

    <button class="btn btn--no-round" onclick={onAddFrame}>+</button>
    <button class="btn btn--no-round" onclick={running ? onPause : onPlay}>
        {#if running}
            <SolarPauseBold />
        {:else}
            <SolarPlayBold />
        {/if}
    </button>
</div>

<style>
    .timeline {
        width: 100%;
        display: flex;
        flex-flow: row;
        overflow: hidden;
    }

    .frame-container {
        touch-action: pan-x;
        user-select: none;
        transition:
            opacity 0.2s,
            transform 0.2s;
    }

    .frame-container {
        user-select: none;
        -webkit-user-select: none;
        transition:
            opacity 0.2s,
            transform 0.2s;
        cursor: grab;
    }

    .frame-container.dragging {
        opacity: 0.5;
        transform: scale(0.95);
        cursor: grabbing;
        z-index: 10;
    }

    .frame-container.drag-over {
        cursor: grabbing;
        z-index: 10;
        background: #622d2d;
    }

    .frame-container.drag-over:global(> .frame) {
        opacity: 0.5;
        transform: scale(0.95);
        cursor: grabbing;
        z-index: 10;
    }

    .frames {
        display: flex;
        flex-flow: row;
        flex: auto;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
    }

    .frames--dragging {
        overflow: hidden;
        /*touch-action: none;*/
    }

    .btn--no-round {
        border-radius: 0;
    }
</style>
