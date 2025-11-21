<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import FaceExpressionPreview from "./FaceExpressionPreview.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";
    import idleFrame from "$lib/testData/frame0_idle_face1.json";
    import talkingFrame from "$lib/testData/frame0_talking_face1.json";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Face/FaceExpressionPreview",
        component: FaceExpressionPreview,
    });
</script>

{#snippet template(props: ComponentProps<typeof FaceExpressionPreview>)}
    <SharedRendererProvider>
        <div
            style="background: #333; width: 100%; height: 100vh; padding: 3rem;"
        >
            <div style="background: #333; width: 100%; height: 128px;">
                <FaceExpressionPreview {...props} />
            </div>
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Empty"
    args={{
        expression: {
            frames: [],
        },
    }}
/>

<Story
    name="Example Idle Expression"
    args={{
        expression: {
            frames: [
                {
                    pixels: idleFrame.pixels as [number, number, number][],
                    duration: 255,
                },
            ],
        },
    }}
/>

<Story
    name="Example Talking Expression"
    args={{
        expression: {
            frames: [
                {
                    pixels: talkingFrame.pixels as [number, number, number][],
                    duration: 255,
                },
            ],
        },
    }}
/>
