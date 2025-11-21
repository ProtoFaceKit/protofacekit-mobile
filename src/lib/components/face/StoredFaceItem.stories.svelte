<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import StoredFaceItem from "./StoredFaceItem.svelte";
    import type { ComponentProps } from "svelte";
    import SharedRendererProvider from "../SharedRendererProvider.svelte";
    import { testFace } from "$lib/testData/testFace";

    const { Story } = defineMeta({
        render: template,
        title: "Components/Face/StoredFaceItem",
        component: StoredFaceItem,
    });
</script>

{#snippet template(props: ComponentProps<typeof StoredFaceItem>)}
    <SharedRendererProvider>
        <div
            style="background: #111; width: 100%; height: 100vh; padding: 1rem;"
        >
            <StoredFaceItem {...props} />
        </div>
    </SharedRendererProvider>
{/snippet}

<Story
    name="Default"
    args={{
        item: {
            id: "test",
            name: "Test",
            face: testFace(),
        },
    }}
/>
