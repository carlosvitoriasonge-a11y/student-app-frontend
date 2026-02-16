<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { attendanceStore, parseClassId, formatClassLabel } from "$lib/stores/attendanceStore.js";
  export let params;
  import { apiFetch } from "$lib/api.js";



  let attendance;
  let gridKey;

  $: attendance = $attendanceStore;
  $: console.log("SEATS:", attendance?.seats);
  $: console.log("CURRENT LAYOUT:", attendance?.layout);
  $: console.log("CURRENT SEATS:", attendance?.seats);
  $: gridKey = attendance?.layout + "-" + JSON.stringify(attendance?.seats);
  $: console.log("REACTIVE TICK");


  const course = params.course;
  const grade = params.grade;
  const className = params.className;

  const localClassId = `${course}-${grade}-${className}`;
  const { class_name } = parseClassId(localClassId);
  const classLabel = formatClassLabel({ course, grade, class_name });


  const defaultRows = 5;
  const defaultCols = 6; 

 
  let today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD sem UTC



  let layoutRows = defaultRows;
  let layoutCols = defaultCols;

  // ===============================
// CALCULA TAMANHO REAL DO GRID
// ===============================
$: {
  if (attendance?.seats && attendance.seats.length > 0) {
    layoutRows = Math.max(...attendance.seats.map(s => Number(s.row))) || defaultRows;
    layoutCols = Math.max(...attendance.seats.map(s => Number(s.col))) || defaultCols;
  } else {
    layoutRows = defaultRows;
    layoutCols = defaultCols;
  }
}


  let timer = null;
  let longPressTriggered = false;

  function startLongPress(studentId) {
    if (!studentId) return;
    longPressTriggered = false;
    timer = setTimeout(() => {
      longPressTriggered = true;
      attendanceStore.showPhoto(String(studentId));
    }, 500);
  }

  function endLongPress() {
    clearTimeout(timer);
    if (longPressTriggered) {
      setTimeout(() => {
        longPressTriggered = false;
        attendanceStore.hidePhoto();
      }, 100);
    } else {
      attendanceStore.hidePhoto();
    }
  }

  function getStudent(id) {
    const sid = String(id ?? "");
    return (attendance?.studentsInfo || []).find(
      s => sid === String(s.id ?? s.student_id)
    );
  }

  $: photoStudent =
    attendance?.showPhoto
      ? getStudent(attendance.showPhoto)
      : null;



  async function init() {
    // 1. Carregar alunos e attendance
    await attendanceStore.loadStudents(localClassId);
    await attendanceStore.loadAttendance(today, localClassId);

    // 2. Extrair course/grade/class_name
    const { course, grade, class_name } = parseClassId(localClassId);

    // 3. Buscar preferência salva no backend
    let preferred = "auto";
    try {
      const prefRes = await apiFetch(
        `/api/seating/preference?course=${encodeURIComponent(course)}&grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(class_name)}`
      );
      const pref = prefRes?.json ? await prefRes.json() : prefRes;

      const p =pref?.preferred_layout
      if (["auto", "custom", "A", "B", "C"].includes(p)) {
        preferred = p;
      } else {
        preferred = "auto";
      }

    } catch (err) {
      console.error("Erro ao carregar preferência:", err);
      preferred = "auto";
    }

    // 4. Carregar seating com o layout correto
    await attendanceStore.loadSeating(localClassId, preferred);
  }

  onMount(init);




  async function switchLayout(layout) {
    await attendanceStore.loadSeating(localClassId, layout);

  }

  function statusColor(status) {
    switch (status) {
      case "未記録": return "#cccccc";
      case "出席": return "#A7F3D0";
      case "欠席": return "#FCA5A5";
      case "遅刻": return "#FDE68A";
      case "早退": return "#FDBA74";
      case "遅刻と早退": return "#C4B5FD";
      case "出席停止": return "#DC2626";
      case "忌引き": return "#000000";
      case "公欠": return "#3B82F6";
      default: return "#E5E7EB";
    }
  }

  function resetStatus(studentId) { updateStatus(studentId, "未記録"); }

  /* =========================
     TEACHER VIEW SEMPRE
     ========================= */

  function seatAt(r, c) {
    const found = attendance.seats.find(
      s => Number(s.row) - 1 === r && Number(s.col) - 1 === c
    );
  

    return found ?? null;
  }

  function statusTextColor(status) {
  switch (status) {
    case "忌引き": return "white";
    default: return "#222";
  }
}


</script>

<style>
  .page { 
    display:flex; 
    gap:20px; 
    align-items:flex-start; 
    height: 100vh;
    overflow: visible;
  }
  .main-area {
  flex: 0 0 auto;     /* ← NÃO encolhe, NÃO cresce, tamanho natural */
  height: 100%; /* ← scroll horizontal se precisar */
  overflow-y: auto; 
  max-width: 1000px;  /* ← scroll vertical se precisar */
}

  .aside-area { 
    width:250px; 
    max-width:35%; 
    min-width:240px; 
    border-left:1px solid #eee; 
    padding-left:16px; 
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
  
  }
  .grid {
  display: grid;
  gap: 6px;
  margin-top: 16px;

  grid-template-columns: repeat(var(--cols), minmax(70px, 1fr));
  grid-auto-rows: 70px;

  align-items: stretch;
}

    .grid-item {
    width: 100%;
    height: 100%;
    display: flex;
    }






  .seat {
  max-height: 100px;
  min-height: 110px;
  min-width: 100px;
  max-width: 100px;
  padding: 4px 6px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  border-radius: 6px;
  text-align: center;
  overflow: hidden;
  }


  .inactive { background:#ddd; color:#666; }
  .teacher-desk { margin-top:12px; font-weight:700; text-align:center; }
  .layout-switch { display:flex; gap:6px; }
  .student-list { list-style:none; padding:0; margin:8px 0 0 0; display:flex; flex-direction:column; gap:8px; }
  .student-item { padding:8px; border-radius:6px; background:#fafafa; border:1px solid #eee; }
  .no-photo-text { width:120px; height:120px; display:flex; align-items:center; justify-content:center; background:#f3f4f6; color:#6b7280; border-radius:6px; text-align:center; padding:8px; font-size:14px; line-height:1.2; }
  .seat-name {
    line-height: 1.05;
  word-break: break-word;
  overflow: hidden;

  font-size: clamp(0.45rem, 3cqw, 0.85rem);

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}


  .header-row { 
    display: flex; 
    align-items: center; 
    justify-content: flex-start; 
    gap: 12px; 
    flex-wrap: nowrap; /* impede quebrar linha */ 
    white-space: nowrap; /* impede quebra interna */ 
  }

  .header-info { 
    font-size: 0.9rem; 
    color: #444; }

  .seat.unrecorded { 
    background: #ccc; color: #333; border: 1px dashed #666; }

    .seat-kana {
  font-size: 12px;
  color: #555;
  line-height: 1.0;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}





</style>

<div class="header-row">
<label>
  日付
  <input type="date" bind:value={today} on:change={() => attendanceStore.loadAttendance(today, localClassId)} />
</label>

<div class="layout-switch">
  <button on:click={() => switchLayout("auto")} disabled={attendance?.layout === "auto"}>出席番号順</button>
  <button on:click={() => switchLayout("custom")} disabled={attendance?.layout === "custom"}>カスタム</button>
  <button on:click={() => switchLayout("A")} disabled={attendance?.layout === "A"}>A</button>
  <button on:click={() => switchLayout("B")} disabled={attendance?.layout === "B"}>B</button>
  <button on:click={() => switchLayout("C")} disabled={attendance?.layout === "C"}>C</button>
</div>



<div class="layout-switch">
  <button on:click={() => attendanceStore.setFixedLayout("auto")}>出席番号順に固定</button>
  <button on:click={() => attendanceStore.setFixedLayout("custom")}>カスタムに固定</button>
  <button on:click={() => attendanceStore.setFixedLayout("A")}>Aに固定</button>
  <button on:click={() => attendanceStore.setFixedLayout("B")}>Bに固定</button>
  <button on:click={() => attendanceStore.setFixedLayout("C")}>Cに固定</button>
</div>

<div class="header-info">
  <button class="reset" on:click={() => attendanceStore.resetDay()}>
    リセット
  </button>
  <span class="subtitle">{classLabel}</span>
  <button class="save-btn" style="margin-top:0px;" disabled={!attendance?.dirty} on:click={() => attendanceStore.save()}>保存</button>
  
  
  
  
</div>
</div>



<div class="page">
  <div class="main-area">
    {#if attendance?.seats && attendance.seats.length > 0}
    {#key gridKey}
      <div class="grid"  
      key ={gridKey}
      style={`grid-template-columns: repeat(${layoutCols}, 1fr); grid-auto-rows: minmax(70px,auto);`}>
      {#each Array(layoutRows) as _, r}
  {#each Array(layoutCols) as _, c}
    {@const seat = seatAt(r, c)}
    <div style={`grid-column: ${c + 1}; grid-row: ${r + 1};`}>

      {#if seat !== null}

      {#if seat?.student_id && getStudent(seat.student_id)?.status !== "休学"}
          <!-- SEAT COM ALUNO -->
          <div
            class="seat"
            style="
              background-color: {statusColor(attendance?.students?.[String(seat.student_id)] ?? '未記録')};
              color: {statusTextColor(attendance?.students?.[String(seat.student_id)] ?? '未記録')};
            "
            on:click={() => { if (!longPressTriggered) attendanceStore.setStatus(String(seat.student_id)); }}
            on:pointerdown={() => startLongPress(seat.student_id)}
            on:pointerup={endLongPress}
            on:pointerleave={endLongPress}
          >
            {#if getStudent(seat.student_id)}
              <div class="seat-name">{getStudent(seat.student_id).name}</div>
              <div class="seat-kana">{getStudent(seat.student_id).kana}</div>
            {/if}

            <div style="margin-top:6px; font-size:13px;">
              {attendance?.students?.[String(seat.student_id)] ?? '未記録'}
            </div>
          </div>

        {:else}
          <!-- SEAT VAZIO (空席) -->
          <div class="seat inactive">
            <div class="seat-name">空席</div>
          </div>
        {/if}

      {:else}
        <!-- SEAT BLOQUEADO (×) -->
        <div class="seat inactive">
          <div class="seat-name">×</div>
        </div>
      {/if}


    </div>
  {/each}
{/each}

      </div>

      <div class="teacher-desk">教卓</div>
    {/key}

    {:else}
      <p>座席が読み込まれていません。</p>
    {/if}
  </div>

  <aside class="aside-area">
    <h2>生徒一覧</h2>

    {#if attendance?.studentsInfo && attendance.studentsInfo.length > 0}
      <ul class="student-list">
        {#each attendance.studentsInfo.filter(s => s.status !== "休学") as student}
          {@const sid = String(student.id ?? student.student_id ?? "")}
          {@const allocated = (attendance?.seats || []).some(seat => String(seat?.student_id ?? "") === sid)}

          <li
            class="student-item"
            style="
              opacity: {allocated ? 0.9 : 1};
              cursor: pointer;
              background-color: {statusColor(attendance?.students?.[sid] ?? '未記録')};
              color: {statusTextColor(attendance?.students?.[sid] ?? '未記録')};
            "
            on:click={() => { if (!longPressTriggered) attendanceStore.setStatus(sid); }}
            on:pointerdown={() => startLongPress(sid)}
            on:pointerup={endLongPress}
            on:pointerleave={endLongPress}
          >

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:600;">{student.attend_no}番 {student.name}</div>
                <div style="font-size:12px; color:#666">{student.kana}</div>
              </div>

              <div style="text-align:right; min-width:84px;">
                <div style="font-size:12px; color:#222">{attendance?.students?.[sid] ?? '未記録'}</div>
                {#if allocated}
                  <div style="margin-top:6px; font-size:12px; color:#444">割当済</div>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p>読み込み中...</p>
    {/if}
  </aside>
</div>

{#if photoStudent}
  <div class="photo-bubble"
       style="
         position: absolute;
         top: 20%;
         left: 50%;
         background: white;
         padding: 12px;
         border-radius: 8px;
         box-shadow: 0 4px 12px rgba(0,0,0,0.2);
         z-index: 999;
         text-align: center;
         pointer-events:none;
       ">
    {#if (photoStudent.photo ?? photoStudent.avatar ?? photoStudent.image)}
      <img
        src={
          (() => {
            const p = (photoStudent.photo ?? photoStudent.avatar ?? photoStudent.image);
            if (typeof p !== "string") return '/images/avatar-placeholder.png';
            if (p.startsWith('http://') || p.startsWith('https://')) return `${p}?t=${Date.now()}`;
            return `http://${window.location.hostname}:8000/photos/${p}?t=${Date.now()}`;
          })()
        }
        alt={photoStudent?.name ?? 'photo'}
        on:error={(e) => { e.target.onerror = null; e.target.src = '/images/avatar-placeholder.png'; }}
        width="180"
        height="180"
        style="object-fit:cover; border-radius:6px;"
      />
    {:else}
      <div class="no-photo-text">写真が登録されていません。</div>
    {/if}

    <div style="margin-top:8px; font-weight:600;">{photoStudent.name}</div>
    <div style="font-size: 12px; color: #555">{photoStudent.kana}</div>
  </div>
{/if}


