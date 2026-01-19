<script lang="ts">
    let file: File | null = null;
    let message = "";
    let error = "";
  
    async function uploadCSV() {
      message = "";
      error = "";
  
      if (!file) {
        error = "CSVファイルを選択してください。";
        return;
      }
  
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const res = await fetch("http://localhost:8000/students/import_csv", {
          method: "POST",
          body: formData
        });
  
        if (!res.ok) {
          const err = await res.json();
          error = err.detail || "アップロードに失敗しました。";
          return;
        }
  
        const data = await res.json();
        message = `${data.added} 件の生徒を追加しました。`;
  
      } catch (e) {
        error = "サーバーに接続できません。";
      }
    }
</script>

<h1>CSV 一括登録</h1>

<!-- ★ テンプレートダウンロード -->
<a class="template" href="http://localhost:8000/students/template_csv">
  CSV テンプレートをダウンロード
</a>

<div class="box">
    <label>
      CSV ファイルを選択:
      <input
        type="file"
        accept=".csv"
        on:change={(e) => (file = e.target.files?.[0] || null)}
      />
    </label>

    <button on:click={uploadCSV}>アップロード</button>

    {#if message}
      <p class="success">{message}</p>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}
</div>

<style>
    .box {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      width: 400px;
      background: #fafafa;
    }
    button {
      margin-top: 10px;
      padding: 8px 16px;
    }
    .template {
      display: inline-block;
      margin-bottom: 15px;
      padding: 8px 14px;
      background: #3498db;
      color: white;
      border-radius: 4px;
      text-decoration: none;
    }
    .template:hover {
      background: #2980b9;
    }
    .success {
      color: green;
      margin-top: 10px;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
</style>
