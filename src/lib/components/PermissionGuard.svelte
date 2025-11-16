<script lang="ts">
    import { checkPermissions } from "@mnlphlp/plugin-blec";
    import { type Snippet } from "svelte";

    type Props = {
        children?: Snippet;
    };

    const { children }: Props = $props();

    let checkingPermissionGranted = $state(true);
    let permissionGranted = $state(false);

    $effect(() => {
        let cancelled = false;

        async function checkPermission() {
            try {
                const granted = await checkPermissions(true);
                if (cancelled) return;
                permissionGranted = granted;
            } catch (err) {
                console.error("failed to check permissions", err);
            } finally {
                if (cancelled) return;
                checkingPermissionGranted = false;
            }
        }

        checkingPermissionGranted = true;
        checkPermission();

        return () => {
            cancelled = true;
            checkingPermissionGranted = true;
        };
    });
</script>

{#if checkingPermissionGranted}
    <p>Checking permissions...</p>
{:else if !permissionGranted}
    <p class="grant">Please grant required permissions</p>
{:else}
    {@render children?.()}
{/if}

<style>
    .grant {
        padding: 1rem;
    }
</style>
