<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";

  
    let students = [];
    let loading = true;
  
    onMount(async () => {
      try {
        const res = await apiFetch("/api/students?grade=1");
        students = await res.json();
      } catch (e) {
        console.error("API error:", e);
      } finally {
        loading = false;
      }
    });
  </script>
  
  <h1>1年生のデータ取得テスト</h1>
  
  {#if loading}
    <p>読み込み中...</p>
  {:else if students.length === 0}
    <p>データがありません。</p>
  {:else}
    <ul>
      {#each students as s}
        <li>{s.name}（{s.kana}）</li>
      {/each}
    </ul>
  {/if}
  