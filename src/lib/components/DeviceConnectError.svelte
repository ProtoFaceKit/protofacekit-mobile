<script lang="ts">
    interface Props {
        onBack: VoidFunction;
    }

    const { onBack }: Props = $props();
</script>

<div class="error">
    <h1 class="title">Failed to connect</h1>
    <h1 class="message">Unknown error occurred</h1>

    <button onclick={onBack}>Back</button>
</div>

<style></style>
