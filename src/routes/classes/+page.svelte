<script>
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";

  let classes = [];

  onMount(async () => {
    try {
      classes = await apiFetch("/api/classes");
    } catch (e) {
      console.error("クラス一覧の取得に失敗しました", e);
      classes = [];
    }
  });
</script>

<h1>クラス一覧</h1>

<ul>
  {#each classes as c}
    <li>{c.grade}年 {c.class_name}組（{c.student_count}名）</li>
  {/each}
</ul>
