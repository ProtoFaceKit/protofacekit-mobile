<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import Loader from "./Loader.svelte";

    const { Story } = defineMeta({
        title: "Components/Loaders/Loader",
        component: Loader,
    });
</script>

<Story name="Default" />
