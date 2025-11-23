<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import FrameTimelineItem from "./FrameTimelineItem.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";
    import idleFrame from "$lib/testData/frame0_idle_face1.json";
    import talkingFrame from "$lib/testData/frame0_talking_face1.json";
    import type { Pixel } from "$lib/types/data";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Frame/FrameTimelineItem",
        component: FrameTimelineItem,
    });
</script>

{#snippet template(props: ComponentProps<typeof FrameTimelineItem>)}
    <SharedRendererProvider>
        <div style="background: #333; width: 100%; height: 100vh;">
            <div style="background: #333; width: 100%; height: 128px;">
                <FrameTimelineItem {...props} />
            </div>
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Default"
    args={{
        frame: {
            duration: 255,
            pixels: idleFrame.pixels as [number, number, number][] as Pixel[],
        },
        active: true,
        onSelect: () => {},
        onChangeDuration: () => {},
    }}
/>
