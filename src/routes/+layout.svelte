<script>
    let studentMenuOpen = false;

    let mainMenu = [
      { name: "教員管理", page: "/teachers" },
      { name: "設定", page: "/settings" }
    ];

    let studentMenu = [
      { name: "生徒一覧", page: "/students" },
      { name: "生徒登録", page: "/students/new" },
      { name: "CSV 一括登録", page: "/students/import" },

      // ★ 修正済み：/students/promote → /promote
      { name: "昇級処理", page: "/promote" },

      { name: "成績入力", page: "/students/grades" },
      { name: "クラス分け処理", page: "/classes/assign" },
      { name: "卒業生一覧", page: "/students/graduates" }
    ];
</script>

<div class="app-container">
    <header class="header">
      <div class="title">英心高等学校　生徒管理アプリ</div>
      <div class="user-area">
        <span>管理者</span>
        <button>設定</button>
        <button>ログアウト</button>
      </div>
    </header>

    <div class="main">
      <aside class="sidebar">

        <!-- 生徒管理メニュー -->
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

        <!-- その他のメニュー -->
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
