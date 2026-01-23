<script>
  import { browser } from "$app/environment";
  import { sessionTimeout } from "$lib/stores/sessionTimeout";
  import { onMount } from "svelte";
  import ServerStatus from "$lib/ServerStatus.svelte";
  import { apiFetch } from "$lib/api";
  import { goto } from "$app/navigation";



  let studentMenuOpen = false;

  let mainMenu = [
    { name: "教員管理", page: "/teachers" },
    { name: "設定", page: "/settings" }
  ];

  let studentMenu = [
    { name: "生徒一覧", page: "/students" },
    { name: "生徒登録", page: "/students/new" },
    { name: "CSV 一括登録", page: "/students/import" },
    { name: "昇級処理", page: "/promote" },
    { name: "成績入力", page: "/grades" },
    { name: "クラス分け処理", page: "/classes/assign" },
    { name: "卒業生一覧", page: "/students/graduates" },
    { name: "転出者一覧", page: "/exit" }
  ];

  let lastActivity = Date.now();
  let timeoutMinutes = 5;

  $: sessionTimeout.subscribe(v => timeoutMinutes = v);

  function resetActivity() {
      lastActivity = Date.now();
  }

  onMount(() => {
      // 🔐 Proteção de rota
      if (browser) {
          const key = localStorage.getItem("appKey");
          if (!key && window.location.pathname !== "/login") {
              window.location.href = "/login";
              return;
          }
      }

      // SSR-safe
      if (!browser) return;

      // 🕒 Monitorar atividade
      window.addEventListener("mousemove", resetActivity);
      window.addEventListener("keydown", resetActivity);
      window.addEventListener("click", resetActivity);
      window.addEventListener("scroll", resetActivity);

      // 🔄 Logout automático
      setInterval(() => {
          const diff = Date.now() - lastActivity;
          if (diff > timeoutMinutes * 60 * 1000) {
              localStorage.removeItem("appKey");
              window.location.href = "/login";
          }
      }, 30000);
  });
</script>

<div class="app-container">
  <header class="header">
    <div class="title">英心高等学校　生徒管理アプリ</div>
    <ServerStatus />
    <div class="user-area">
      <span>管理者</span>
      <button on:click={() => goto("/settings")} class="btn">設定</button>
      <button on:click={() => {
          if (browser) {
              localStorage.removeItem("appKey");
              window.location.href = "/login";
          }
      }}>ログアウト</button>
    </div>
  </header>

  <div class="main">
    <aside class="sidebar">
      <div class="menu-item parent" on:click={() => studentMenuOpen = !studentMenuOpen}>
        生徒管理
      </div>

      {#if studentMenuOpen}
        <div class="submenu">
          {#each studentMenu as item}
            <a class="menu-item child"
               href={item.page}
               data-sveltekit-preload-data>
               {item.name}
            </a>
          {/each}
        </div>
      {/if}

      {#each mainMenu as item}
        <a class="menu-item"
           href={item.page}
           data-sveltekit-preload-data>
           {item.name}
        </a>
      {/each}
    </aside>

    <section class="content">
      <slot />
    </section>
  </div>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: sans-serif;
  }

  .header {
    height: 60px;
    background: #2c3e50;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }

  .title {
    font-size: 20px;
    font-weight: bold;
  }

  .main {
    display: flex;
    flex: 1;
  }

  .sidebar {
    width: 200px;
    background: #ecf0f1;
    padding: 10px;
    border-right: 1px solid #ccc;
  }

  .menu-item {
    display: block;
    padding: 10px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
  }

  .menu-item:hover {
    background: #d0d7de;
  }

  .parent {
    font-weight: bold;
    background: #dfe6e9;
  }

  .submenu {
    margin-left: 10px;
    border-left: 2px solid #b2bec3;
    padding-left: 8px;
  }

  .child {
    font-size: 0.95rem;
  }

  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
</style>
