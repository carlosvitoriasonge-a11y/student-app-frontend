<script>
    export let data;
  
    const course = data.course;
    const grade = data.grade;
    const className = data.className;
    const students = (data.students ?? []).filter(st => st.status !== "休学");

  
    let selectedDate = new Date().toLocaleDateString("sv-SE");
  
    const days = ["月", "火", "水", "木", "金"];
    const periodKeys = [
      "HR",
      "１限目",
      "２限目",
      "３限目",
      "４限目",
      "５限目",
      "６限目",
      "SHR_PM"
    ];
  
    let marks = {};
    let subjects = {};


    function abbreviateSubject(name) {
  if (!name) return "";

  return name
    .replace("英語コミュニケーションⅠ", "英コⅠ")
    .replace("英語コミュニケーションⅡ", "英コⅡ");
}

  
function compactStatus(full) {
  if (!full) return "";

  // mais específicos primeiro
  if (full.includes("遅刻と早退")) return "遅早";
  if (full.includes("停止")) return "停";
  if (full.includes("忌引")) return "忌";
  if (full.includes("公欠")) return "公";
  if (full.includes("怠学")) return "怠";
  if (full.includes("忘れ物")) return "忘";

  // depois os genéricos
  if (full.includes("遅刻")) return "遅";
  if (full.includes("早退")) return "早";
  if (full.includes("欠席")) return "／";
  if (full.includes("出席")) return "◎";

  return "";
}

  
    function morningSHR(finalSymbol) {
      if (!finalSymbol) return "";
      if (finalSymbol === "◎") return "◎";
      if (finalSymbol === "遅" || finalSymbol === "遅早") return "／";
      if (finalSymbol === "早") return "◎";
      if (finalSymbol === "忌") return "忌";
      if (finalSymbol === "停") return "停";
      if (finalSymbol === "公") return "公";
      if (finalSymbol === "／") return "／";
      return "";
    }
  
    function getWeekDates(baseDateStr) {
      const base = new Date(baseDateStr);
      const day = base.getDay();
      const mondayOffset = (day + 6) % 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - mondayOffset);
  
      const result = {};
      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        result[days[i]] = `${yyyy}-${mm}-${dd}`;
      }
      return result;
    }
  
    async function loadWeek() {
      const token = localStorage.getItem("access_token");
      const weekDates = getWeekDates(selectedDate);
  
      marks = {};
      subjects = {};
  
      for (const st of students) {
        marks[st.id] = {};
        for (const d of days) {
          marks[st.id][d] = Array(periodKeys.length).fill("");
        }
      }
  
      for (const d of days) {
        const iso = weekDates[d];
        subjects[d] = {};
        const token = localStorage.getItem("access_token");
const classId = `${course}-${grade}-${className}`;

// attendance_sub
const subRes = await fetch(
  `/api/attendance_sub?date=${iso}&course=${course}&grade=${grade}&class_name=${encodeURIComponent(className)}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const subJson = subRes.ok ? await subRes.json() : {};
const subDay = subJson?.classes?.[classId]?.[iso] ?? {};

// attendance (SHR)
const attRes = await fetch(
  `/api/attendance?date=${iso}&course=${course}&grade=${grade}&class_name=${encodeURIComponent(className)}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const attJson = attRes.ok ? await attRes.json() : {};
const attDay = attJson?.classes?.[classId] ?? {};

  
        const attStudents = attDay?.students ?? {};
        for (const st of students) {
          const full = attStudents[st.id];
          const finalSymbol = compactStatus(full);
          const morningSymbol = morningSHR(finalSymbol);
  
          marks[st.id][d][0] = morningSymbol;
          marks[st.id][d][7] = finalSymbol;
        }
  
        for (const period of ["１限目", "２限目", "３限目", "４限目", "５限目", "６限目"]) {
          const info = subDay?.[period];
  
          subjects[d][period] = info?.subject ?? "";
  
          const pStudents = info?.students ?? {};
          for (const st of students) {
            const full = pStudents[st.id];
            const symbol = compactStatus(full);
            const idx = periodKeys.indexOf(period);
            marks[st.id][d][idx] = symbol;
          }
        }
      }
    }
  
    $: loadWeek(selectedDate);
  </script>
  
  <div style="margin-bottom: 12px;">
    <label>選択日：</label>
    <input type="date" bind:value={selectedDate} />
  </div>
  
  <div class="week-grid">
    <div class="name-table">
      <div class="day-header"></div>
      <div class="cell header"></div>
      <div class="cell header header-name">名　前</div>
  
      {#each students as st}
        <div class="cell name">{st.attend_no} {st.name}</div>
      {/each}
    </div>
  
    {#each days as d}
    <div class="day-table">
        <div class="day-header">{d}曜日</div>
  
        {#each periodKeys as p}
          <div class="cell header">
            {p === "SHR_AM" ? "SHR" : p === "SHR_PM" ? "HR" : p.replace("限目", "")}
          </div>
        {/each}
  
        {#each periodKeys as p}
          <div class="cell header vertical">
            {p === "SHR_AM" || p === "SHR_PM"
  ? ""
  : abbreviateSubject(subjects?.[d]?.[p] ?? "")
}

          </div>
        {/each}
  
        {#each students as st}
          {#each (marks?.[st.id]?.[d] ?? Array(periodKeys.length).fill("")) as m}
            <div class="cell">{m}</div>
          {/each}
        {/each}
      </div>
    {/each}
  </div>
  
  <style>
:root {
  --col-width: 23px;
  --name-col-width: 150px;
}

.week-grid {
  display: flex;
  gap: 4px;
}

.name-table {
  display: grid;
  grid-template-columns: var(--name-col-width);
  border: 1px solid #333;
  left: 0;
  z-index: 20;
  background: white;
  grid-auto-rows: 28px; /* <<< AQUI */
  grid-auto-rows: 28px; /* <<< AQUI */
  grid-template-rows:
  32px   /* linha 1 */
  28px   /* linha 2 */
  70px;  /* linha 3 */
}

.day-table {
  display: grid;
  border: 1px solid #333;
  grid-template-columns:
    var(--col-width)
    var(--col-width)
    var(--col-width)
    var(--col-width)
    var(--col-width)
    var(--col-width)
    var(--col-width)
    var(--col-width);
  grid-auto-rows: 28px; /* <<< AQUI */
  grid-template-rows:
  32px   /* linha 1 */
  28px   /* linha 2 */
  70px;  /* linha 3 */

}

.day-table > div:nth-child(n+10):nth-child(-n+17){
min-height: px; /* <<< AQUI */
}

.day-header {
  grid-column: 1 / -1;
  background: #ddd;
  font-weight: bold;
  text-align: center;
  padding: 4px;
  border-bottom: 1px solid #333;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
  font-size: 12px;
  padding: 1px;
}

.header {
  background: #eee;
  font-weight: bold;
}

.header-name {
  background: #eee;
  z-index: 11;
}

.vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  padding: 0;
}

.name {
  background: #f9f9f9;
}




  </style>
  