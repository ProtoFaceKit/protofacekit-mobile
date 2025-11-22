<script>
    import { writeFace } from "$lib/ble";
    import { ExpressionType } from "$lib/types/data";
    import { toastErrorMessage } from "$lib/utils/error";
    import { createDefaultFramePixels } from "$lib/utils/image";
    import { toast } from "svelte-sonner";
</script>

<div class="container">
    <div class="heading">
        <div class="path">
            <p class="path--segment">Oneshot</p>
        </div>

        <div class="actions">
            <a class="btn" href="/">Back</a>
        </div>
    </div>

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

    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        margin-bottom: 0.5rem;
        padding: 0 0.5rem;
    }

    .path {
        display: flex;
        flex-flow: row;
        gap: 0.5rem;
        align-items: center;
        flex: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 0.5rem;
    }

    .path--segment {
        color: #999;
        font-size: 1.25rem;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }
</style>
