<script>
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import ServerStatus from "$lib/ServerStatus.svelte";
  import { goto } from "$app/navigation";

  // -------------------------------
  // LOGOUT POR INATIVIDADE
  // -------------------------------
  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    const minutes = Number(localStorage.getItem("logout_minutes")) || 15;
    const LIMIT = minutes * 60 * 1000;

    inactivityTimer = setTimeout(() => {
      if (browser) {
        localStorage.removeItem("access_token");
        goto("/login");
      }
    }, LIMIT);
  }

  function startInactivityWatcher() {
    if (!browser) return;

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);

    resetInactivityTimer();
  }

  // -------------------------------
  // VERIFICA TOKEN AO ENTRAR
  // -------------------------------
  onMount(() => {
    if (!browser) return;

    if (window.location.pathname !== "/login") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        goto("/login");
        return;
      }

      startInactivityWatcher();
    }
  });

  // -------------------------------
  // SIDEBAR RETRÁTIL (sempre)
  // -------------------------------
  let sidebarOpen = true; // começa aberta, igual antes

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

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
</script>

<div class="app-container">
  <header class="header">
    <button class="menu-toggle" on:click={toggleSidebar}>☰</button>

    <div class="title">英心高等学校　生徒管理アプリ</div>
    <ServerStatus />

    <div class="user-area">
      <span>管理者</span>
      <button on:click={() => goto("/settings")} class="btn">設定</button>
      <button
        on:click={() => {
          if (browser) {
            localStorage.removeItem("access_token");
            goto("/login");
          }
        }}
      >
        ログアウト
      </button>
    </div>
  </header>

  {#if sidebarOpen}
    <div class="overlay" on:click={() => (sidebarOpen = false)}></div>
  {/if}

  <div class="main">
    <aside class="sidebar" class:open={sidebarOpen}>
      <div class="menu-item parent" on:click={() => (studentMenuOpen = !studentMenuOpen)}>
        生徒管理
      </div>

      {#if studentMenuOpen}
        <div class="submenu">
          {#each studentMenu as item}
            <a class="menu-item child" href={item.page} data-sveltekit-preload-data>
              {item.name}
            </a>
          {/each}
        </div>
      {/if}

      {#each mainMenu as item}
        <a class="menu-item" href={item.page} data-sveltekit-preload-data>
          {item.name}
        </a>
      {/each}
    </aside>

    <section class="content" class:shifted={sidebarOpen}>
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
    position: fixed; 
    top: 0; 
    left: 0; 
    right: 0; 
    height: 60px; 
    background: #2c3e50;
    color: white;
    display: flex;
    align-items: center; 
    justify-content: space-between; 
    padding: 0 20px; 
    z-index: 2000; /* fica acima da sidebar */
  }

  .menu-toggle {
    font-size: 26px;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    margin-right: 10px;
  }

  .main {
    display: flex;
    flex: 1;
    margin-top: 60px; /* empurra o conteúdo para baixo do header */
  }

  /* -------------------------------
     SIDEBAR RETRÁTIL (sempre)
  --------------------------------*/
  .sidebar {
    width: 200px;
    background: #ecf0f1;
    padding: 10px;
    border-right: 1px solid #ccc;
    position: fixed;
    top: 60px;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* Overlay com fade */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    animation: fadeIn 0.3s ease;
    z-index: 900;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Conteúdo desliza quando sidebar abre */
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    margin-left: 0;
    transition: margin-left 0.3s ease;
  }

  .content.shifted {
    margin-left: 200px;
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
</style>
