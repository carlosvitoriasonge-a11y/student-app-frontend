<script>
  export const ssr = false; // ← ISSO É IMPORTANTE

  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import ServerStatus from "$lib/ServerStatus.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { apiFetch } from "$lib/api";
  import { on } from "svelte/events";


  // dados vindos do +layout.js
  export let data;

  export function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }


  // -------------------------------
  // LOGOUT POR INATIVIDADE
  // -------------------------------
  let inactivityTimer;
  let watcherStarted = false;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    const raw = localStorage.getItem("logout_minutes");
    const minutes = raw && !isNaN(Number(raw)) ? Number(raw) : 15;
    const LIMIT = minutes * 60 * 1000;

    inactivityTimer = setTimeout(() => {
      if (browser) {
        localStorage.removeItem("access_token");
        goto("/login");
      }
    }, LIMIT);
  }

  function startInactivityWatcher() {
    if (!browser || watcherStarted) return;

    watcherStarted = true;

    // remove listeners antigos
    window.removeEventListener("mousemove", resetInactivityTimer);
    window.removeEventListener("keydown", resetInactivityTimer);
    window.removeEventListener("click", resetInactivityTimer);
    window.removeEventListener("scroll", resetInactivityTimer);

    // adiciona listeners novos
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);

    resetInactivityTimer();
  }


  let classMenuOpen = false;
  let classMenu = [];

  const courseLabel = (c) => {
    if (c === "全") return "全日";
    if (c === "水") return "水曜";
    if (c === "集") return "集中";
    return c;
  };

  $: if (data?.allStudents) {
    const set = new Set();

    for (const s of data.allStudents) {
      const className = String(s.class_name || "").trim();
      if (!className) continue;

      const key = `${s.course}-${s.grade}-${className}`;
      set.add(key);
    }

    

    classMenu = Array.from(set).map((key) => {
      const [course, grade, className] = key.split("-");
      return {
        course,
        grade: Number(grade),
        className,
        name: `${courseLabel(course)} ${grade}年 ${className}`,
        page: `/class/${course}/${grade}/${className}`
      };
    });

    // ordenar por curso, depois por série, depois por nome da classe
    const courseOrder = { 
      "全": 1, 
      "水": 2, 
      "集": 3 
    };
    
    classMenu.sort((a, b) => {
      const courseDiff = (courseOrder[a.course] - courseOrder[b.course]);
      if (courseDiff !== 0) return courseDiff;

      const gradeDiff = a.grade - b.grade;
      if (gradeDiff !== 0) return gradeDiff;

      return a.className.localeCompare(b.className, "ja");

    });

  }
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
    { name: "休学中の生徒一覧", page: "/students/suspended" },
    { name: "生徒登録", page: "/students/new" },
    { name: "CSV 一括登録", page: "/students/import" },
    { name: "昇級処理", page: "/promote" },
    { name: "成績入力", page: "/grades" },
    { name: "クラス分け処理", page: "/classes/assign" },
    { name: "卒業生一覧", page: "/students/graduates" },
    { name: "転出者一覧", page: "/exit" }
  ];

onMount(() => {
  if (!browser) return;

  if (window.location.pathname !== "/login") {
    startInactivityWatcher();
  }
});

let now = new Date();

function toWareki(date) {
  const y =date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];

  let era = "";
  let eraYear = y;

  if (y >= 2019) {
    era = "令和";
    eraYear = y - 2018;
  } else if (y >= 1989) {
    era = "平成";
    eraYear = y - 1988;
  } else if (y >= 1926) {
    era = "昭和";
    eraYear = y - 1925;
  } 

  return `${y}年（${era}${eraYear}年）${m}月${d}日（${weekday}）`;
}

onMount(() => {
  setInterval(() => {
    now = new Date();
  }, 1000); // atualiza a cada minuto
});

async function changeClass(url) {
  await goto(url);
  await invalidateAll();
}
</script>

<div class="app-container">
  <header class="header">
    <button class="menu-toggle" on:click={toggleSidebar}>☰</button>

    <div class="title">英心高等学校　生徒管理アプリ</div>
    <ServerStatus />
    <div class="clock">
      {toWareki(now)} {now.toLocaleTimeString("ja-JP")}
    </div>
    

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

      <div class="menu-item parent" on:click={() => (classMenuOpen = !classMenuOpen)}>
        クラス管理
      </div>


      {#if classMenuOpen}
        <div class="submenu">
          {#if classMenu.length === 0}
            <div class="menu-item child">クラス分けがまだされていません</div>
          {:else}
          {#each classMenu as item}
          <a
            class="menu-item child"
            href="#"
            on:click={(e) => { e.preventDefault(); changeClass(item.page); }}
          >
            {item.name}
          </a>
        {/each}
        
          {/if}
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

  <div class="fullscreen-fab" on:click={toggleFullscreen}>
    ⛶
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

    /* ← ADICIONE ESTAS LINHAS */ 
    overflow-y: auto; 
    max-height: calc(100vh - 60px); 
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

  .clock {
    font-size: 14px; 
    margin-left: 20px; 
    margin-right: 20px; 
    white-space: nowrap; 
    flex-shrink: 0;
  }

  .fullscreen-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #007aff;
  color: white;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  z-index: 9999;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease;
}

.fullscreen-fab:active {
  transform: scale(0.92);
}


</style>
