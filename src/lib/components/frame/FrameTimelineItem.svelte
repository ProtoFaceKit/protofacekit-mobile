<script lang="ts" module>
    // Shared IntersectionObserver for all frame instances
    let sharedObserver: IntersectionObserver | null = null;
    const observedElements = new Map<
        Element,
        (isIntersecting: boolean) => void
    >();

    function getSharedObserver(): IntersectionObserver {
        if (!sharedObserver) {
            sharedObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const callback = observedElements.get(entry.target);
                        if (callback) {
                            callback(entry.isIntersecting);
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: "50px",
                },
            );
        }

        return sharedObserver;
    }
</script>

<script lang="ts">
    import type { FaceFrame } from "$lib/types/data";
    import FaceRender3D from "../face/FaceRender3D.svelte";

    interface Props {
        frame: FaceFrame;
        active: boolean;

        onSelect: VoidFunction;
        onChangeDuration: (duration: number) => void;
    }

    const { frame, active, onSelect, onChangeDuration }: Props = $props();

    let isWithinViewport = $state(false);

    // Use action instead of bind:this
    function observeViewport(node: HTMLElement) {
        const observer = getSharedObserver();

        // Register callback for this element
        observedElements.set(node, (isIntersecting) => {
            isWithinViewport = isIntersecting;
        });

        observer.observe(node);

        return {
            destroy() {
                observer.unobserve(node);
                observedElements.delete(node);
            },
        };
    }
</script>

<div class="frame" class:frame--active={active} use:observeViewport>
    <button class="preview" onclick={onSelect}>
        {#if isWithinViewport}
            <FaceRender3D pixels={frame.pixels} disableControls />
        {/if}
    </button>

    <div class="duration">
        <input
            class="duration__input"
            type="number"
            value={frame.duration}
            min={1}
            max={255}
            onchange={(event) => {
                onChangeDuration(event.currentTarget.valueAsNumber);
            }}
        />
        <span class="duration__unit">ms</span>
    </div>
</div>

<style>
    .frame {
        display: flex;
        flex-flow: column;
        border: 1px solid #000;
        width: 102px;
    }

    .frame--active {
        border-color: #fff;
    }

    .preview {
        width: 100px;
        height: 64px;
        padding: 0;
        border: 0;
        background-color: transparent;
    }

    .duration {
        color: #999;
        font-size: 0.9rem;
        width: 100%;
        text-align: center;
        background-color: #222;
        padding: 0.25rem 0;
    }

    .duration__input {
        background-color: transparent;
        color: #fff;
        border: none;
        width: auto;
        min-width: 0;
    }
</style>
