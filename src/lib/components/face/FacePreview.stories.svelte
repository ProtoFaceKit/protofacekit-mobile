<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import FacePreview from "./FacePreview.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";
    import { testFace } from "$lib/testData/testFace";
    import idleFrame from "$lib/testData/frame0_idle_face1.json";
    import { ExpressionType } from "$lib/types/data";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Face/FacePreview",
        component: FacePreview,
    });
</script>

{#snippet template(props: ComponentProps<typeof FacePreview>)}
    <SharedRendererProvider>
        <div
            style="background: #333; width: 100%; height: 100vh; padding: 3rem;"
        >
            <div style="background: #333; width: 100%; height: 128px;">
                <FacePreview {...props} />
            </div>
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Empty"
    args={{
        face: {
            expressions: {},
        },
    }}
/>

<Story
    name="Example Face"
    args={{
        face: testFace(),
    }}
/>

<Story
    name="Example Face Single Expression"
    args={{
        face: {
            expressions: {
                [ExpressionType.IDLE]: {
                    frames: [
                        {
                            pixels: idleFrame.pixels as [
                                number,
                                number,
                                number,
                            ][],
                            duration: 255,
                        },
                    ],
                },
            },
        },
    }}
/>
