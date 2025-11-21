<script lang="ts">
    import icon from "$lib/assets/protofacekit.svg";

    type Props = {
        name: string;
        address: string;
        onConnect?: VoidFunction;
    };

    const { name, address, onConnect }: Props = $props();
</script>

<button class="device" onclick={onConnect}>
    <img class="device__logo" src={icon} alt="Device Logo" height={38} />

    <div class="device__details">
        <p class="device--name">{name}</p>
        <p class="device--address">{address}</p>
    </div>
</button>

<style>
    .device {
        display: flex;
        flex-flow: row;
        padding: 0.5em 1em;
        align-items: center;
        gap: 1rem;

        border-radius: 0.45rem;
        border: 1px solid transparent;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        color: #ffffff;
        background-color: #111;
        border: 2px solid #222;
        outline: none;
    }

    .device__details {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
    }

    .device--address {
        color: #999;
    }
</style>
