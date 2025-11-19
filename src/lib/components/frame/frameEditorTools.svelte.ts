import type { RgbColor } from "$lib/types/color";

interface FrameEditorTools {
    paintColor: RgbColor;
    paintSize: number;
    mirror: boolean;
    erase: boolean;
    showPreviousOutline: boolean;
}

const LOCAL_STORAGE_KEY = "editor-tools-state";
const DEFAULT_STATE: FrameEditorTools = {
    paintColor: { r: 255, g: 0, b: 0, a: 1 },
    paintSize: 2,
    mirror: true,
    erase: false,
    showPreviousOutline: true,
};

export function createFrameEditorTools(): FrameEditorTools {
    const tools: FrameEditorTools = $state(getStoredValue());

    function getStoredValue(): FrameEditorTools {
        const value = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (value === null) return DEFAULT_STATE;
        return JSON.parse(value);
    }

    function setStoredValue(value: FrameEditorTools) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    }

    return {
        get paintColor() {
            return tools.paintColor;
        },
        set paintColor(value) {
            tools.paintColor = value;
            setStoredValue(tools);
        },
        get paintSize() {
            return tools.paintSize;
        },
        set paintSize(value) {
            tools.paintSize = value;
            setStoredValue(tools);
        },
        get mirror() {
            return tools.mirror;
        },
        set mirror(value) {
            tools.mirror = value;
            setStoredValue(tools);
        },
        get erase() {
            return tools.erase;
        },
        set erase(value) {
            tools.erase = value;
            setStoredValue(tools);
        },
        get showPreviousOutline() {
            return tools.showPreviousOutline;
        },
        set showPreviousOutline(value) {
            tools.showPreviousOutline = value;
            setStoredValue(tools);
        },
    };
}
