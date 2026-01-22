<script>

    function formatJapaneseDate(dateStr) {
        if (!dateStr) return "";

        const [y, m, d] = dateStr.split("-");
        const year = Number(y);
        const reiwa = year - 2018;

        return `${y}/${m}/${d}（令和${reiwa}年）`;
    }

    export const ssr = false;
    import { onMount } from "svelte";
  
    let data = {};
    let years = [];
    let selectedYear = "";
    let rows = [];
  
    let counts = {
      "退学": { 男: 0, 女: 0, 合計: 0 },
      "転学": { 男: 0, 女: 0, 合計: 0 },
      "除籍": { 男: 0, 女: 0, 合計: 0 },
      "合計": { 男: 0, 女: 0, 合計: 0 }
    };
  
    const ORDER = ["退学", "転学", "除籍"];
  
    function resetCounts() {
      for (const k in counts) {
        counts[k].男 = 0;
        counts[k].女 = 0;
        counts[k].合計 = 0;
      }
    }
  
    function updateView() {
      if (!selectedYear) return;
  
      rows = [...data[selectedYear]];
      rows.sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  
      resetCounts();
  
      for (const r of rows) {
        const g = r.student.gender;
        counts[r.type][g]++;
        counts[r.type].合計++;
  
        counts["合計"][g]++;
        counts["合計"].合計++;
      }
    }
  
    onMount(async () => {
      const res = await fetch("/api/students/exit_list");
      data = await res.json();

      console.log("EXIT LIST DATA:", data);
  
      years = Object.keys(data).sort((a, b) => b - a);
      console.log("YEARS:", years);

      if (years.length > 0) {
        selectedYear = years[0];
        updateView();
      }
    });
    window.exitData = data;
  </script>
  
  <h1>転出者一覧</h1>
  
  <label>
    年度：
    <select bind:value={selectedYear} on:change={updateView}>
      {#each years as y}
        <option value={y}>{y}年度</option>
      {/each}
    </select>
  </label>
  
  <table class="list">
    <thead>
      <tr>
        <th>日付</th>
        <th>区分</th>
        <th>ID</th>
        <th>氏名</th>
        <th>性別</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr class={r.type}>
            <td>{formatJapaneseDate(r.date)}</td>
          <td>{r.type}</td>
          <td>{r.student.id}</td>
          <td>{r.student.name}</td>
          <td>{r.student.gender}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  
  <h3>集計</h3>
  
  <table class="summary">
    <thead>
      <tr>
        <th></th>
        <th>男</th>
        <th>女</th>
        <th>合計</th>
      </tr>
    </thead>
    <tbody>
      {#each ["退学", "転学", "除籍", "合計"] as k}
        <tr>
          <th>{k}</th>
          <td>{counts[k].男}</td>
          <td>{counts[k].女}</td>
          <td>{counts[k].合計}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  
  <style>
    table {
      border-collapse: collapse;
      margin-top: 16px;
    }
  
    th, td {
      border: 1px solid #ccc;
      padding: 6px 10px;
      text-align: center;
    }
  
    .list {
      width: 100%;
      margin-top: 12px;
    }
  
    .summary {
      margin-top: 12px;
      width: 300px;
    }
  
    tr.退学 { background: #f5f5f5; }
    tr.転学 { background: #eef5ff; }
    tr.除籍 { background: #ffecec; }
  </style>
  