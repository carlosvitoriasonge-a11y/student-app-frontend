<script>
    const menu = [
        { label: "補習対象者リスト", path: "/kyomu/hoshuu" },
        { label: "補習管理画面", path: "/kyomu/hoshuumanage" },
        { label: "再履修管理画面", path: "/kyomu/sairishuu" },
        { label: "再履修完了済み一覧", path: "/kyomu/sairishuulist" }
    ];
</script>

<h1>教務メニュー</h1>

<div class="menu-grid">
    {#each menu as item}
        <a class="menu-btn" href={item.path}>
            {item.label}
        </a>
    {/each}
</div>

<style>
    h1 {
        font-size: 2rem;
        margin-bottom: 20px;
        text-align: center;
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 20px;
        padding: 10px;
    }

    .menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 26px 20px;
        font-size: 1.4rem;
        font-weight: bold;
        background: #f5f5f5;
        border-radius: 16px;
        border: 2px solid #ddd;
        text-decoration: none;
        color: #333;
        text-align: center;
        transition: 0.15s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }

    .menu-btn:hover,
    .menu-btn:active {
        background: #e0f0ff;
        border-color: #4da3ff;
        transform: scale(1.03);
        box-shadow: 0 4px 8px rgba(0,0,0,0.12);
    }
</style>
