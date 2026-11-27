<script>
  import { onMount } from 'svelte';
  import { apiFetch } from "$lib/api";

  let today = new Date();
  let month = today.getMonth() + 1;

  let calEvents = [];
  let calConfigured = false;
  let calLoaded = false;
  let calError = false;

  let tmrEvents = [];
  let tmrConfigured = false;
  let tmrLoaded = false;
  let tmrError = false;

  let missing = {};
  let hasMissing = false;

  onMount(async () => {
    try {
      const res = await apiFetch("/api/students/no_photo");
      const data = res?.json ? await res.json() : res;

      console.log("DEBUG no_photo:", data);

      missing = data || {};
      hasMissing = Object.keys(missing).length > 0;
    } catch (e) {
      console.error("Erro ao carregar alunos sem foto:", e);
    }
  });

  // Busca os eventos com novas tentativas: uma falha momentânea de
  // conexão não pode fazer o cartão sumir da tela inicial.
  async function fetchCalendar(path) {
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const data = await apiFetch(path);
        if (data && !data.error) return data;
        lastErr = new Error(data?.error || "resposta vazia");
      } catch (e) {
        lastErr = e;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
    throw lastErr;
  }

  onMount(async () => {
    try {
      const data = await fetchCalendar("/api/calendar/today");
      calConfigured = !!data?.configured;
      calEvents = data?.events || [];
    } catch (e) {
      console.error("Erro ao carregar eventos de hoje:", e);
      calError = true;
      calConfigured = true; // mostra o cartão com o aviso, em vez de sumir
    } finally {
      calLoaded = true;
    }
  });

  onMount(async () => {
    try {
      const data = await fetchCalendar("/api/calendar/tomorrow");
      tmrConfigured = !!data?.configured;
      tmrEvents = data?.events || [];
    } catch (e) {
      console.error("Erro ao carregar eventos de amanhã:", e);
      tmrError = true;
      tmrConfigured = true; // mostra o cartão com o aviso, em vez de sumir
    } finally {
      tmrLoaded = true;
    }
  });
</script>


<h1>教務管理システム</h1>

<p>英心高校教務管理システムへようこそ。左側のメニューから操作を選択してください。</p>
<p>☆使用後は必ずログアウトをしてください。☆</p>

{#if calLoaded && calConfigured}
  <div style="margin-top:25px; border:1px solid #ccc; border-radius:8px; padding:15px; max-width:640px;">
    <h2 style="margin-top:0;">📅 本日の行事</h2>
    {#if calError}
      <p style="color:#b00;">行事を読み込めませんでした。ページを再読み込みしてください。</p>
    {:else if calEvents.length === 0}
      <p>本日の行事はありません。</p>
    {:else}
      <ul style="list-style:none; padding-left:0; margin-bottom:0;">
        {#each calEvents as ev}
          <li style="padding:4px 0; border-bottom:1px solid #eee;">
            {#if ev.all_day}
              <span style="color:#666;">終日</span>
            {:else}
              <span style="color:#666;">{ev.start_time}〜{ev.end_time}</span>
            {/if}
            {ev.title}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

{#if tmrLoaded && tmrConfigured}
  <div style="margin-top:15px; border:1px solid #ccc; border-radius:8px; padding:15px; max-width:640px;">
    <h2 style="margin-top:0;">📅 明日の行事</h2>
    {#if tmrError}
      <p style="color:#b00;">行事を読み込めませんでした。ページを再読み込みしてください。</p>
    {:else if tmrEvents.length === 0}
      <p>明日の行事はありません。</p>
    {:else}
      <ul style="list-style:none; padding-left:0; margin-bottom:0;">
        {#each tmrEvents as ev}
          <li style="padding:4px 0; border-bottom:1px solid #eee;">
            {#if ev.all_day}
              <span style="color:#666;">終日</span>
            {:else}
              <span style="color:#666;">{ev.start_time}〜{ev.end_time}</span>
            {/if}
            {ev.title}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}


{#if month === 9}
  <p style="color:red; font-weight:bold; margin-top:20px;">
    ☆教務の先生へ：　今年は9月卒業の生徒がいれば、9月中に卒業処理をしてください。☆
  </p>
{/if}

{#if month === 3}
  <p style="color:red; font-weight:bold; margin-top:20px;">
    ☆教務の先生へ：　出席日数、成績などの内容を確認し、昇級処理を今月中にしてください。☆
    注意：　昇級処理をしてしまうと、全ての記録が登録されます。後から変更はできませんので、内容を十分に確認してから処理をしてください。☆
  </p>
{/if}




{#if hasMissing}
  <h2 style="margin-top:30px; color:red; font-weight:bold;">
    📸 写真未登録の生徒
  </h2>

  {#each Object.keys(missing).sort() as course}
    <h2 style="margin-top:25px;">
      {course === "全" ? "全日" : course === "水" ? "水曜" : course === "集" ? "集中" : course}
    </h2>

    {#each Object.keys(missing[course]).sort() as className}
      <h3 style="margin-top:10px;">{className}</h3>
      <ul>
        {#each missing[course][className] as st}
          <li>{st.name}（{st.id}）</li>
        {/each}
      </ul>
    {/each}
  {/each}
{/if}



