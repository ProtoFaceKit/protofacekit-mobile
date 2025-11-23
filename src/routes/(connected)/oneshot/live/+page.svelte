<script lang="ts">
    import { writeFace } from "$lib/ble";
    import FrameEditor from "$lib/components/editor/FrameEditor.svelte";
    import FaceRender3D from "$lib/components/face/FaceRender3D.svelte";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";
    import {
        ExpressionType,
        type FaceFrame,
        type Pixel,
    } from "$lib/types/data";
    import { createDefaultFramePixels } from "$lib/utils/image";
    import { useDebounce } from "runed";

    let frame: FaceFrame = $state({
        duration: 255,
        pixels: createDefaultFramePixels(),
    });
    let editorFullscreen = $state(false);

    const uploadFace = useDebounce(() => {
        writeFace({
            expressions: {
                [ExpressionType.IDLE]: {
                    frames: [frame],
                },
            },
        });
    }, 300);

    function onChangePixels(pixels: Pixel[]) {
        frame = {
            ...frame,
            pixels,
        };

        uploadFace();
    }

    function onToggleFullscreen() {
        editorFullscreen = !editorFullscreen;
    }
</script>

<div class="container">
    <PageHeading name="Live Editor">
        {#snippet actions()}
            <a class="btn" href="/oneshot">Back</a>
        {/snippet}
    </PageHeading>

    <div class="preview">
        <FaceRender3D pixels={frame.pixels ?? []} />
    </div>

    <div class="editor" class:editor--fullscreen={editorFullscreen && frame}>
        <FrameEditor {frame} {onToggleFullscreen} {onChangePixels} />
    </div>
</div>

<style>
    .container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-flow: column;
    }

    .preview {
        height: 192px;
        background: black;
    }

    .editor {
        flex: auto;
        touch-action: none;
    }

    .editor--fullscreen {
        position: absolute;
        left: 0;
        top: env(safe-area-inset-top);
        width: 100%;
        height: calc(
            100% - env(safe-area-inset-top) - env(safe-area-inset-bottom)
        );
        z-index: 999;
    }
</style>
