<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import FrameTimeline from "./FrameTimeline.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";
    import idleFrame from "$lib/testData/frame0_idle_face1.json";
    import talkingFrame from "$lib/testData/frame0_talking_face1.json";
    import type { Pixel } from "$lib/types/data";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Frame/FrameTimeline",
        component: FrameTimeline,
    });
</script>

{#snippet template(props: ComponentProps<typeof FrameTimeline>)}
    <SharedRendererProvider>
        <div style="background: #333; width: 100%; height: 100vh;">
            <div style="background: #333; width: 100%; height: 128px;">
                <FrameTimeline {...props} />
            </div>
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Default"
    args={{
        frames: [
            {
                duration: 255,
                pixels: idleFrame.pixels as [
                    number,
                    number,
                    number,
                ][] as Pixel[],
            },
            {
                duration: 255,
                pixels: talkingFrame.pixels as [
                    number,
                    number,
                    number,
                ][] as Pixel[],
            },
            {
                duration: 255,
                pixels: talkingFrame.pixels as [
                    number,
                    number,
                    number,
                ][] as Pixel[],
            },
            {
                duration: 255,
                pixels: talkingFrame.pixels as [
                    number,
                    number,
                    number,
                ][] as Pixel[],
            },
        ],
        activeFrameIndex: 0,
        onAddFrame: () => {},
        onSelectFrame: () => {},
        onChangeFrameDuration: () => {},
        onMoveFrame: () => {},
        running: false,
        onPlay: () => {},
        onPause: () => {},
    }}
/>
