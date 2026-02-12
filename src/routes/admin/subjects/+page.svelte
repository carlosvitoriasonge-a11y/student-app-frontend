<script>
    const menu = [
        { label: "必修科目一覧", path: "/admin/subjects/required" },
        { label: "探究科目一覧", path: "/admin/subjects/optional" },
    ];
</script>

<h1>教科・科目管理</h1>

<ul>
    {#each menu as item}
        <li>
            <a href={item.path}>{item.label}</a>
        </li>
    {/each}
</ul>
