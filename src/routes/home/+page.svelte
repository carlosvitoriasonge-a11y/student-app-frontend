<script>
    let today = new Date(); // usa o fuso do navegador automaticamente
    let month = today.getMonth() + 1; // 0 = janeiro, 8 = setembro

    import { onMount } from 'svelte';


    let events = [];
    let googleToken = localStorage.getItem("google_access_token");

    // ⭐ FUNÇÃO DE LOGIN DO GOOGLE
    const GOOGLE_CLIENT_ID = "404733269225-o1lmoqrgk3nnlkh6oedarn8eh9opvuiv.apps.googleusercontent.com"; // <-- coloque o seu aqui

    


</script>
  

<h1>学生管理システム</h1>

<p>英心高校学生管理システムへようこそ。左側のメニューから操作を選択してください。</p>
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