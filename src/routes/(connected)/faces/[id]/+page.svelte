<script lang="ts">
    import FacePreview from "$lib/components/face/FacePreview.svelte";
    import { faceContext } from "$lib/context/faceContext.svelte";
    import SolarTrashBin2BoldDuotone from "~icons/solar/trash-bin-2-bold-duotone";
    const context = faceContext.get();
    const face = $derived(context.face);
</script>

<div>
    <div class="heading">
        <div class="path">
            <p class="path--segment">Faces /</p>
            <h1 class="path--name">
                {face.name}
            </h1>
        </div>

        <div class="actions">
            <a class="btn" href="/">Back</a>
            <a class="btn btn--primary" href="/faces/{face.id}/delete">
                <SolarTrashBin2BoldDuotone />
            </a>
        </div>
    </div>
</div>

<div class="preview">
    <FacePreview face={face.face} />
</div>

<div class="actions"></div>

<style>
    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        overflow: hidden;
    }

    .preview {
        height: 192px;
        background: black;
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

    .path--name {
        color: #fff;
        font-size: 1.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .path--segment {
        color: #999;
        font-size: 1.25rem;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        gap: 1rem;
        flex-shrink: 0;
    }
</style>
