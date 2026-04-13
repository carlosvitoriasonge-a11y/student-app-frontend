<script>
  import { onMount } from 'svelte';
  import { apiFetch } from "$lib/api";

  let today = new Date();
  let month = today.getMonth() + 1;

  let events = [];
  let googleToken = localStorage.getItem("google_access_token");

  const GOOGLE_CLIENT_ID = "404733269225-o1lmoqrgk3nnlkh6oedarn8eh9opvuiv.apps.googleusercontent.com";

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
</script>


<h1>教務管理システム</h1>

<p>英心高校教務管理システムへようこそ。左側のメニューから操作を選択してください。</p>
<p>☆使用後は必ずログアウトをしてください。☆</p>


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





