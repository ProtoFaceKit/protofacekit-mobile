<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import DiscoveryLoader from "./DiscoveryLoader.svelte";

    const { Story } = defineMeta({
        title: "Components/Loaders/DiscoveryLoader",
        component: DiscoveryLoader,
    });
</script>

<Story name="Default" />
