<script>
  import { onMount } from "svelte";

  let classes = [];

  onMount(async () => {
    const res = await fetch("http://localhost:8000/classes");
    classes = await res.json();
  });
</script>

<h1>クラス一覧</h1>

<ul>
  {#each classes as c}
    <li>{c.grade}年 {c.class_name}組（{c.student_count}名）</li>
  {/each}
</ul>
