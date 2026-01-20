<script>
  // 基本項目
  let name = "";
  let kana = "";
  let gender = "男";
  let year = "";
  let course = "全";
  let grade = "";

  // 追加項目
  let birth_date = "";
  let admission_date = "";
  let junior_high = "";
  let junior_high_grad_date = "";
  let postal_code = "";
  let address1 = "";
  let address2 = "";
  let phone = "";
  let phone_label = "";
  let guardian1 = "";
  let guardian1_kana = "";
  let guardian_address = "";
  let emergency1 = "";
  let emergency2 = "";
  let emergency1label = "";
  let emergency2label = "";
  let contact_time = "";
  let note1 = "";
  let note2 = "";
  let commute = "";

  let submitting = false;
  let message = "";

  async function submit() {
    submitting = true;
    message = "";

    const body = {
      name,
      kana,
      gender,
      year,
      course,
      grade,
      birth_date,
      admission_date,
      junior_high,
      junior_high_grad_date,
      postal_code,
      address1,
      address2,
      phone,
      phone_label,
      guardian1,
      guardian1_kana,
      guardian_address,
      emergency1,
      emergency2,
      emergency1label,
      emergency2label,
      contact_time,
      note1,
      note2,
      commute
    };

    try {
      const res = await fetch("/api/students/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Error:", err);
        message = "登録に失敗しました";
        return;
      }

      const data = await res.json();
      message = `登録しました（ID: ${data.id}）`;

      // ★★★ 登録成功後の処理（ここが重要） ★★★

      // 入力欄リセット
      name = "";
      kana = "";
      gender = "男";
      year = "";
      course = "全";
      grade = "";

      birth_date = "";
      admission_date = "";
      junior_high = "";
      junior_high_grad_date = "";
      postal_code = "";
      address1 = "";
      address2 = "";
      phone = "";
      phone_label = "";
      guardian1 = "";
      guardian1_kana = "";
      guardian_address = "";
      emergency1 = "";
      emergency2 = "";
      emergency1label = "";
      emergency2label = "";
      contact_time = "";
      note1 = "";
      note2 = "";
      commute = "";

      // ダイアログ表示
      alert(`登録しました（ID: ${data.id}）`);

    } catch (e) {
      console.error(e);
      message = "通信エラーが発生しました";
    } finally {
      submitting = false;
    }
  }
</script>

<h1>生徒登録</h1>

{#if message}
  <p>{message}</p>
{/if}

<form on:submit|preventDefault={submit}>
  <fieldset disabled={submitting}>
    <legend>基本情報</legend>

    <label>氏名：<input bind:value={name} required /></label>
    <label>ふりがな：<input bind:value={kana} required /></label>

    <label>
      性別：
      <select bind:value={gender}>
        <option value="男">男</option>
        <option value="女">女</option>
      </select>
    </label>

    <label>入学年度（ID用）：<input bind:value={year} required /></label>

    <label>
      コース：
      <select bind:value={course}>
        <option value="全">全日</option>
        <option value="水">本科（水曜）</option>
        <option value="集">本科（集中）</option>
      </select>
    </label>

    <label>学年：<input bind:value={grade} /></label>
  </fieldset>

  <fieldset disabled={submitting}>
    <legend>詳細情報</legend>

    <label>生年月日：<input bind:value={birth_date} /></label>
    <label>入学年月日：<input bind:value={admission_date} /></label>
    <label>出身中学校：<input bind:value={junior_high} /></label>
    <label>中学校卒業年月日：<input bind:value={junior_high_grad_date} /></label>

    <label>〒：<input bind:value={postal_code} /></label>
    <label>住所１：<input bind:value={address1} /></label>
    <label>住所２：<input bind:value={address2} /></label>

    <label>電話番号：<input bind:value={phone} /></label>
    <label>電話ラベル：<input bind:value={phone_label} /></label>

    <label>保護者名１：<input bind:value={guardian1} /></label>
    <label>保護者名１ふりがな：<input bind:value={guardian1_kana} /></label>
    <label>保護者住所：<input bind:value={guardian_address} /></label>

    <label>緊急連絡先①：<input bind:value={emergency1} /></label>
    <label>緊急連絡先①ラベル：<input bind:value={emergency1label} /></label>

    <label>緊急連絡先②：<input bind:value={emergency2} /></label>
    <label>緊急連絡先②ラベル：<input bind:value={emergency2label} /></label>

    <label>つながりやすい時間帯：<input bind:value={contact_time} /></label>

    <label>備考①：<textarea bind:value={note1}></textarea></label>
    <label>備考②：<textarea bind:value={note2}></textarea></label>

    <label>通学方法：<input bind:value={commute} /></label>
  </fieldset>

  <button type="submit" disabled={submitting}>登録</button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  fieldset {
    border: 1px solid #ccc;
    padding: 12px;
  }
  label {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }
  input, select, textarea {
    padding: 4px;
    font-size: 14px;
  }
  textarea {
    min-height: 60px;
  }
</style>
