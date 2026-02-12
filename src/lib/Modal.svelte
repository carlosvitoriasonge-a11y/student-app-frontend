<script>
    export let open = false
    export let close = () => {}
</script>

{#if open}
    <div class="overlay" on:click={close}>
        <div class="modal" on:click|stopPropagation>
            <button class="close" on:click={close}>×</button>
            <slot></slot>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        position: relative;
    }

    .close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
    }
</style>
