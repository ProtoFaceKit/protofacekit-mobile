<script>
    import { writeFace } from "$lib/ble";
    import PageHeading from "$lib/components/layout/PageHeading.svelte";
    import { ExpressionType } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { createDefaultFramePixels } from "$lib/utils/image";
    import { toast } from "svelte-sonner";
</script>

<div class="container">
    <PageHeading name="One-shot">
        {#snippet actions()}
            <a class="btn" href="/">Back</a>
        {/snippet}
    </PageHeading>

    <div class="links">
        <a class="btn btn--large btn--span" href="/oneshot/image">
            Upload Image
        </a>
        <a class="btn btn--large btn--span" href="/oneshot/gif">Upload GIF</a>
        <a class="btn btn--large btn--span" href="/oneshot/live">
            Live Editor
        </a>

        <button
            class="btn btn--large btn--span"
            onclick={() => {
                const writePromise = writeFace({
                    expressions: {
                        [ExpressionType.IDLE]: {
                            frames: [
                                {
                                    pixels: createDefaultFramePixels(),
                                    duration: 255,
                                },
                            ],
                        },
                    },
                });
                toast.promise(writePromise, {
                    loading: "Sending face...",
                    success: "Sent face to controller!",
                    error: toastErrorMessage("Failed to send face"),
                });
            }}
        >
            Blank
        </button>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        height: 100%;
        overflow: hidden;
    }

    .links {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        padding: 1rem;
    }
</style>
