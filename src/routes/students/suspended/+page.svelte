<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";
  
    let students = [];
    let loading = true;
  
    onMount(async () => {
      const data = await apiFetch("/api/students/suspended");
      students = data;
      loading = false;
    });
  </script>
  
  <h1>休学中の生徒一覧</h1>
  
  {#if loading}
    <p>読み込み中...</p>
  {:else if students.length === 0}
    <p>休学中の生徒はいません。</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>名前（漢字）</th>
          <th>ふりがな</th>
          <th>性別</th>
          <th>学年</th>
          <th>クラス</th>
          <th>ID</th>
        </tr>
      </thead>
  
      <tbody>
        {#each students as s}
          <tr>
            <td>
              <a href={`/students/${s.id}`}>{s.name}</a>
            </td>
            <td>{s.kana}</td>
            <td>{s.gender}</td>
            <td>{s.grade}</td>
            <td>{s.class_name}</td>
            <td>{s.id}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    a {
      color: blue;
      text-decoration: underline;
      cursor: pointer;
    }
  </style>
  