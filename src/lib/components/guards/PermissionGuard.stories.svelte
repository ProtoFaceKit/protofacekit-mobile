<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";

    import PermissionGuard from "./PermissionGuard.svelte";

    const { Story } = defineMeta({
        title: "Components/Guards/PermissionGuard",
        component: PermissionGuard,
    });
</script>

<Story
    name="Checking"
    args={{
        permissionInterface: {
            checking: true,
            granted: false,
            grant: () => {},
            check: () => {},
            cancel: () => {},
        },
    }}
/>

<Story
    name="Permission Granted"
    args={{
        permissionInterface: {
            checking: false,
            granted: true,
            grant: () => {},
            check: () => {},
            cancel: () => {},
        },
    }}
>
    <p style="color: #fff">Permission is granted</p>
</Story>

<Story
    name="Permission not granted"
    args={{
        permissionInterface: {
            checking: false,
            granted: false,
            grant: () => {},
            check: () => {},
            cancel: () => {},
        },
    }}
/>
