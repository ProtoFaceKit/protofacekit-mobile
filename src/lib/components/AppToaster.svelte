<script lang="ts">
    import { Toaster } from "svelte-sonner";
    import "$lib/styles/toaster.css";
</script>

<Toaster
    theme="dark"
    richColors
    closeButton
    position="top-center"
    visibleToasts={3}
    duration={1000}
    mobileOffset={{ top: 50 }}
/>
