<script>
    import { sessionTimeout } from "$lib/stores/sessionTimeout";
  
    const options = [
      { label: "5 分", value: 5 },
      { label: "15 分", value: 15 },
      { label: "30 分", value: 30 }
    ];
  </script>
  
  <h1>設定</h1>
  
  <div>
    <label>自動ログアウトまでの時間：</label>
    <select bind:value={$sessionTimeout}>
      {#each options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>
  