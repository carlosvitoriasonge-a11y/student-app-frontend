<script lang="ts">
  import { apiFetch } from "$lib/api.js";

  let file: File | null = null;
  let message = "";
  let error = "";

  // -------------------------------
  // CSV UPLOAD
  // -------------------------------
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
      // ✔ CORREÇÃO: rota correta é /api/students/import_csv
      const data = await apiFetch(
        "/api/students/import_csv",
        {
          method: "POST",
          body: formData
        },
        "json"
      );

      message = `${data.added} 件の生徒を追加しました。`;

    } catch (e : any) {
      // Tenta extrair a mensagem do backend 
      let detail = e?.response?.data?.detail || e?.message || "";

      // ------------------------------- 
      // MAPEAMENTO DE ERROS ESPECÍFICOS 
      // ------------------------------- 
      if (detail === "duplicate_student") { 
        error = "既に登録されている生徒が含まれています。"; 
      } 
      else if (detail.includes("コースが判別できません")) { 
        error = "コース列に誤りがあります。CSV を確認してください。"; 
      } else if (detail.includes("同じCSVがすでにアップロードされています")) { 
        error = "同じ CSV は再度アップロードできません。"; 
      } else if (detail.includes("入学年月日") || detail.includes("編入学") || detail.includes("転入学")) { 
        error = "入学関連の日付に誤りがあります。CSV を確認してください。"; 
      } else if (detail.includes("CSVファイルをアップロードしてください")) { 
        error = "CSV ファイルを選択してください。"; 
      } else { 
        // ------------------------------- 
        // ERRO DESCONHECIDO → fallback 
        // ------------------------------- 
        error = "エラーが発生しました。CSV を確認してください。";
      }
  }
}

  // -------------------------------
  // CSV TEMPLATE DOWNLOAD
  // -------------------------------
  async function downloadTemplate() {
    error = "";
    message = "";

    try {
      const blob = await apiFetch("/api/students/template_csv", {}, "blob");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template.csv";
      a.click();

    } catch (e) {
      error = "テンプレートをダウンロードできません。";
    }
  }
</script>

<h1>CSV 一括登録</h1>

<button class="template" on:click={downloadTemplate}>
  CSV テンプレートをダウンロード
</button>

<div class="box">
  <label>
    CSV ファイルを選択:
    <input
      type="file"
      accept=".csv"
      on:change={(e) => {
        const input = e.target as HTMLInputElement;
        file = input.files?.[0] || null;
      }}
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
