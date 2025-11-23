<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        path?: string[];
        name: string;
        actions?: Snippet;
    }

    const { path, name, actions }: Props = $props();
</script>

<div class="heading">
    <div class="path">
        {#if path && path.length > 0}
            {#each path as segment, i (i)}
                <p class="path--segment">
                    {segment}
                    {#if i < path.length}
                        /
                    {/if}
                </p>
            {/each}
        {/if}

        <h1 class="path--name">{name}</h1>
    </div>

    <div class="actions">
        {@render actions?.()}
    </div>
</div>

<style>
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

    .path--name {
        color: #fff;
        font-size: 1.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }
</style>
