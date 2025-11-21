<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import FaceRender3D from "./FaceRender3D.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";

    import idleFrame from "$lib/testData/frame0_idle_face1.json";
    import talkingFrame from "$lib/testData/frame0_talking_face1.json";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Face/FaceRender3D",
        component: FaceRender3D,
        parameters: {
            controls: {
                exclude: "pixels",
            },
        },
    });
</script>

{#snippet template(props: ComponentProps<typeof FaceRender3D>)}
    <SharedRendererProvider>
        <div
            style="background: #333; width: 100%; height: 100vh; padding: 3rem;"
        >
            <div style="background: #333; width: 100%; height: 128px;">
                <FaceRender3D {...props} />
            </div>
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Empty"
    args={{
        pixels: [],
    }}
/>

<Story
    name="Disabled Controls"
    args={{
        pixels: [],
        disableControls: true,
    }}
/>

<Story
    name="Example Idle Face"
    args={{
        pixels: idleFrame.pixels as [number, number, number][],
    }}
/>

<Story
    name="Example Talking Face"
    args={{
        pixels: talkingFrame.pixels as [number, number, number][],
    }}
/>
