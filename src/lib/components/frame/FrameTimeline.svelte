<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import FrameTimelineItem from "./FrameTimelineItem.svelte";
    import SolarPlayBold from "~icons/solar/play-bold";
    import SolarPauseBold from "~icons/solar/pause-bold";

    interface Props {
        frames: FaceFrame[];
        activeFrameIndex: number;

        onAddFrame: VoidFunction;
        onSelectFrame: (index: number) => void;
        onChangeFrameDuration: (index: number, duration: number) => void;

        running: boolean;
        onPlay: VoidFunction;
        onPause: VoidFunction;
    }

    const {
        frames,
        activeFrameIndex,
        onAddFrame,
        running,
        onPlay,
        onPause,
        onSelectFrame,
        onChangeFrameDuration,
    }: Props = $props();
</script>

<div class="timeline">
    <div class="frames">
        {#each frames as frame, index (index)}
            <FrameTimelineItem
                {frame}
                active={index === activeFrameIndex}
                onSelect={() => onSelectFrame(index)}
                onChangeDuration={(duration) => {
                    onChangeFrameDuration(index, duration);
                }}
            />
        {/each}
    </div>

    <button class="btn" onclick={onAddFrame}>+</button>
    <button class="btn" onclick={running ? onPause : onPlay}>
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

    .frames {
        display: flex;
        flex-flow: row;
        flex: auto;
        overflow: auto;
    }
</style>
