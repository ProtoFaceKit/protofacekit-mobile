<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import SolarPaintRollerBoldDuotone from "~icons/solar/paint-roller-bold-duotone";
    import SolarEraserBoldDuotone from "~icons/solar/eraser-bold-duotone";
    import SolarMaximizeBold from "~icons/solar/maximize-bold";

    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";

    interface Props {
        frame: FaceFrame;

        onDelete: VoidFunction;
        onToggleFullscreen: VoidFunction;
    }

    const { frame, onDelete, onToggleFullscreen }: Props = $props();
</script>

<div class="frame">
    <div class="actions">
        <button onclick={onDelete}>
            <SolarTrashBin2BoldDuotone />
        </button>
        <button onclick={onToggleFullscreen}>
            <SolarMaximizeBold />
        </button>
    </div>

    <div class="canvas"></div>

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
</style>
