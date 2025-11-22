import type { Pixel } from "$lib/types/data";

interface FrameEditorHistoryOptions {
    maxHistorySize?: number;
}

interface FrameEditorHistory {
    /**
     * Whether there are changes that we can undo
     */
    undoEnabled: boolean;
    /**
     * Whether there are changes we can redo
     */
    redoEnabled: boolean;

    /**
     * Begin a new "change set"
     */
    beginChangeSet(): void;
    /**
     * Push a pixel change to the current set
     *
     * @param pixelIndex Index of the pixel
     * @param previous The pixel before the change
     * @param updated The pixel after the change
     */
    pushChange(pixelIndex: number, previous: Pixel, updated: Pixel): void;
    /**
     * End the current change set pushing it to the change history
     */
    endChangeSet(): void;

    /**
     * Perform an undo operation on the provided pixels set
     *
     * @param pixels The pixels to update
     */
    undo(pixels: Pixel[]): void;
    /**
     * Perform a redo operation on the provided pixels set
     *
     * @param pixels The pixels to update
     */
    redo(pixels: Pixel[]): void;
}

interface PixelChange {
    pixelIndex: number;
    previous: Pixel;
    updated: Pixel;
}

export function createFrameEditorHistory({
    maxHistorySize = 100,
}: FrameEditorHistoryOptions = {}): FrameEditorHistory {
    // Stack of previous changes for Undo
    let changeStack: PixelChange[][] = $state([]);
    // Stack of reverted changes for Redo
    let redoStack: PixelChange[][] = $state([]);

    // Current set of changes that will be pushed to changes on completes
    let currentChangeSet: PixelChange[] = [];

    function beginChangeSet() {
        console.debug("started change set");
        currentChangeSet = [];
        redoStack = [];
    }

    function pushChange(pixelIndex: number, previous: Pixel, updated: Pixel) {
        currentChangeSet.push({
            pixelIndex,
            previous,
            updated,
        });
    }

    function endChangeSet() {
        console.debug("ended change set");

        if (currentChangeSet.length > 0) {
            changeStack.push(currentChangeSet);
            currentChangeSet = [];
        }

        // Remove oldest items when the history size is exceeded
        while (changeStack.length > maxHistorySize) {
            changeStack.shift();
        }
    }

    function undo(pixels: Pixel[]) {
        const item = changeStack.pop();
        if (!item) return;

        for (const change of item.toReversed()) {
            pixels[change.pixelIndex] = [...change.previous];
        }

        // Push the item onto the "redo" stack using the current color value
        redoStack.push(item);
    }

    function redo(pixels: Pixel[]) {
        const item = redoStack.pop();
        if (!item) return;

        beginChangeSet();

        for (const change of item.toReversed()) {
            const pixelIndex = change.pixelIndex;
            const previous: Pixel = pixels[pixelIndex];
            const updated: Pixel = change.updated;
            pixels[pixelIndex] = updated;

            pushChange(pixelIndex, previous, updated);
        }

        endChangeSet();
    }

    return {
        get undoEnabled() {
            return changeStack.length > 0;
        },
        get redoEnabled() {
            return redoStack.length > 0;
        },
        beginChangeSet,
        pushChange,
        endChangeSet,
        undo,
        redo,
    };
}
