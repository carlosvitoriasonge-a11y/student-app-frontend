// src/lib/stores/attendanceStore.js
import { writable, get } from "svelte/store";
import { apiFetch } from "$lib/api";
import { goto } from "$app/navigation";

const UNRECORDED = "未記録";


const HR_CYCLE = [
  "出席",
  "欠席",
  "遅刻",
  "早退",
  "遅刻と早退",
  "出席停止",
  "忌引き",
  "公欠"
];

const LESSON_CYCLE = ["出席", "欠席"];

function nextStatusHR(current) {
  const i = HR_CYCLE.indexOf(current);
  return HR_CYCLE[(i + 1) % HR_CYCLE.length];
}

function nextStatusLesson(current) {
  const i = LESSON_CYCLE.indexOf(current);
  return LESSON_CYCLE[(i + 1) % LESSON_CYCLE.length];
}

export function parseClassId(classId) {
  if (!classId) return { course: "", grade: "", class_name: "" };
  const parts = classId.split("-");
  return {
    course: parts[0] ?? "",
    grade: parts[1] ?? "",
    class_name: parts.slice(2).join("-") ?? ""
  };
}

export function formatClassLabel({ course, grade, class_name }) {
  const courseName =
    course === "全" ? "全日コース" :
    course === "水" ? "水曜日コース" :
    course === "集" ? "集中コース" :
    course; // fallback

  return `${courseName}　${grade}年${class_name}`;
}



function createAttendanceStore() {
  const store = writable({
    mode: "HR",
    layout: "auto",
    seats: [],
    students: {},
    studentsInfo: [],
    showPhoto: null,
    dirty: false,
    date: "",
    classId: "",
    subject: null,
    counts: {
      attendance: 0,
      absence: 0,
      late: 0,
      early: 0,
      stopped: 0,
      mourn: 0,
      justified: 0
    }
  });

  function computeCountsFromMap(studentsMap) {
    const counts = {
      attendance: 0,
      absence: 0,
      late: 0,
      early: 0,
      stopped: 0,
      mourn: 0,
      justified: 0
    };

    if (!studentsMap) return counts;

    Object.entries(studentsMap).forEach(([id, status]) => {
      const s = String(status ?? "");
      switch (s) {
        case "出席":
          counts.attendance += 1;
          break;
        case "欠席":
          counts.absence += 1;
          break;
        case "遅刻":
          counts.late += 1;
          counts.attendance += 1;
          break;
        case "早退":
          counts.early += 1;
          counts.attendance += 1;
          break;
        case "遅刻と早退":
          counts.late += 1;
          counts.early += 1;
          counts.attendance += 1;
          break;
        case "出席停止":
          counts.stopped += 1;
          break;
        case "忌引き":
          counts.mourn += 1;
          break;
        case "公欠":
          counts.justified += 1;
      }
    });

    return counts;
  }

  function updateCountsInStore() {
    store.update(s => {
      const counts = computeCountsFromMap(s.students || {});
      return { ...s, counts };
    });
  }

  function ensureStudentsHaveEntries() {
    store.update(s => {
      const students = { ...(s.students || {}) };
      let dirty = s.dirty;

      (s.studentsInfo || []).forEach(si => {
        const id = String(si.id ?? si.student_id ?? "");
        if (id && students[id] == null) {
          students[id] = UNRECORDED;
          dirty = true;
        }
      });
      return { ...s, students };
    });
    updateCountsInStore();
  }

  // ============================================================
  // ⭐⭐⭐ loadSeating — CORRIGIDO ⭐⭐⭐
  // ============================================================
  async function loadSeating(classId, layout = "auto") {
    const { course, grade, class_name } = parseClassId(classId);

    try {
      const res = await apiFetch(
        `/api/students/seating?course=${encodeURIComponent(course)}&grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(class_name)}`
      );
      const seating = res?.json ? await res.json() : res;

      console.log("SEATING RAW:", seating); 
      console.log("LAYOUT REQUESTED:", layout); 
      console.log("SEATING[layout]:", seating[layout]);
      console.log("LOAD SEATING RESULT:", classId, layout, seating);
      console.log("SEATING RAW FROM BACKEND:", seating); 
      console.log("SEATING.AUTO LENGTH:", seating?.auto?.length); 
      console.log("SEATING.CUSTOM LENGTH:", seating?.custom?.length); 
      console.log("LAYOUT REQUESTED:", layout);


      // ⭐ O backend SEMPRE manda seating[classId].auto/custom
      let selectedLayout = [];

      if (seating && seating[layout]) {
        selectedLayout = seating[layout];
      } else {
        selectedLayout = [];
      }
      

      // normaliza student_id
      let normalizedSeats = selectedLayout.map(seat => ({
        ...seat,
        student_id: seat?.student_id != null ? String(seat.student_id) : seat.student_id
      }));

      // ⭐⭐⭐ SEMPRE inverter verticalmente (teacher view) ⭐⭐⭐
      // ⭐⭐⭐ inverter verticalmente e horizontalmente (teacher view) ⭐⭐⭐
      if (normalizedSeats.length > 0) {
        const maxRow = Math.max(...normalizedSeats.map(s => Number(s.row)));
        const maxCol = Math.max(...normalizedSeats.map(s => Number(s.col)));

        normalizedSeats = normalizedSeats.map(s => ({
          ...s,
          row: maxRow - (Number(s.row) - 1),
          col: maxCol - (Number(s.col) - 1)
        }));
      }



      // ⭐⭐⭐ IMPORTANTE: criar nova referência para forçar re-render ⭐⭐⭐
      store.update(s => ({
        ...s,
        classId,
        layout,
        seats: [...normalizedSeats],
        dirty: true
      }));

      ensureStudentsHaveEntries();
    } catch (err) {
      console.error("loadSeating erro:", err);
      store.update(s => ({ ...s, classId, layout, seats: [] }));
    }
  }

  // ============================================================

  async function loadStudents(classId) {
    const { course, grade, class_name } = parseClassId(classId);
  
    try {
      const res = await apiFetch(
        `/api/students/filter?grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(class_name)}&course=${encodeURIComponent(course)}`
      );
      const data = res?.json ? await res.json() : res;
      const filtered = Array.isArray(data) ? data : [];
  
      const normalized = filtered.map(s => ({
        ...s,
        id: String(s.id ?? s.student_id ?? s.studentNo ?? ""),
        photo: s.photo ?? s.avatar ?? s.image ?? null,
        attend_no: s.attend_no ?? s.attendNo ?? s.no ?? null
      }));
  
      normalized.sort((a, b) => {
        const na = a.attend_no;
        const nb = b.attend_no;
        const ia = na == null ? NaN : Number(String(na).replace(/\D/g, ""));
        const ib = nb == null ? NaN : Number(String(nb).replace(/\D/g, ""));
        if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ia - ib;
        if (!Number.isNaN(ia)) return -1;
        if (!Number.isNaN(ib)) return 1;
        return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { numeric: true, sensitivity: "base" });
      });
  
      store.update(s => ({ ...s, studentsInfo: normalized, dirty: true }));
      ensureStudentsHaveEntries();
    } catch (err) {
      console.error("loadStudents erro:", err);
      store.update(s => ({ ...s, studentsInfo: [] }));
      updateCountsInStore();
    }
  }
  

  async function loadAttendance(date, classId) {
    store.update(s => ({ ...s, date, classId }));
  
    const { course, grade, class_name } = parseClassId(classId);
  
    function initFromStudentsInfo(studentsInfo) {
      const map = {};
      (studentsInfo || []).forEach(s => {
        const id = String(s.id ?? s.student_id ?? "");
        if (id) map[id] = UNRECORDED;
      });
      return map;
    }
  
    // snapshot dos alunos carregados
    let snapshotStudentsInfo;
    store.update(s => {
      snapshotStudentsInfo = s.studentsInfo || [];
      return s;
    });
  
    // estado inicial: todos 出席
    let studentsMap = initFromStudentsInfo(snapshotStudentsInfo);
  
    // ============================================================
    // 1) TENTAR CARREGAR DA API
    // ============================================================
    try {
      const apiUrl = `/api/attendance?date=${encodeURIComponent(date)}&course=${encodeURIComponent(course)}&grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(class_name)}`;
      const res = await apiFetch(apiUrl);
      const data = res?.json ? await res.json() : res;
  
      const apiStudents =
        data?.classes?.[classId]?.students ??
        data?.students ??
        {};
  
      const hasSavedData = Object.keys(apiStudents).length > 0;
  
      studentsMap = {
        ...studentsMap,
        ...Object.fromEntries(
          Object.entries(apiStudents).map(([k, v]) => [String(k), v])
        )
      };
  
      store.update(s => ({
        ...s,
        students: studentsMap,
        dirty: !hasSavedData   // ← se não tem registro salvo, dirty = true
      }));
  
      updateCountsInStore();
      return;
    } catch (err) {
      console.debug("attendance API não disponível:", err);
    }
  
    // ============================================================
    // 2) TENTAR CARREGAR DO ARQUIVO LOCAL
    // ============================================================
    try {
      const path = `/attendance/${date}.json`;
      const res = await fetch(path);
  
      if (res.ok) {
        const data = await res.json();
        const fileStudents = data.classes?.[classId]?.students ?? {};
  
        const hasSavedData = Object.keys(fileStudents).length > 0;
  
        studentsMap = {
          ...studentsMap,
          ...Object.fromEntries(
            Object.entries(fileStudents).map(([k, v]) => [String(k), v])
          )
        };
  
        store.update(s => ({
          ...s,
          students: studentsMap,
          dirty: !hasSavedData   // ← mesma lógica
        }));
  
        updateCountsInStore();
        return;
      }
    } catch (err) {
      console.debug("erro ao buscar arquivo estático:", err);
    }
  
    // ============================================================
    // 3) NENHUM REGISTRO EXISTE → dirty = true
    // ============================================================
    store.update(s => ({
      ...s,
      students: studentsMap,
      dirty: true   // ← primeira chamada do dia → precisa salvar
    }));
  
    updateCountsInStore();
  }
  


  function setStatus(studentId) {
    const sid = String(studentId ?? "");
  
    store.update(s => {
      const current = s.students[sid] || UNRECORDED;
  
      let next;
      if (current === UNRECORDED) {
        next = "出席"; // primeiro clique vira 出席
      } else {
        next = s.mode === "HR" ? nextStatusHR(current) : nextStatusLesson(current);
      }
  
      const newStudents = { ...s.students, [sid]: next };
  
      return {
        ...s,
        students: newStudents,
        dirty: true
      };
    });
  
    updateCountsInStore();
  }
  

  function showPhoto(studentId) {
    store.update(s => ({ ...s, showPhoto: String(studentId) }));
  }

  function hidePhoto() {
    store.update(s => ({ ...s, showPhoto: null }));
  }

  async function save() {
    let snapshot;
    store.update(s => {
      snapshot = s;
      return s;
    });

    const payload = {
      date: snapshot.date,
      classes: {
        [snapshot.classId]: {
          students: snapshot.students
        }
      }
    };

    try {
      await apiFetch("/api/attendance/save", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      store.update(s => ({ ...s, dirty: false }));

      const { course, grade, class_name } = parseClassId(snapshot.classId);
      goto(`/class/${course}/${grade}/${class_name}`);

      return;
    } catch (err) {
      console.debug("save via API falhou:", err);
    }

    try {
      const res = await fetch(`/attendance/${snapshot.date}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`fallback save failed: ${res.status}`);
      store.update(s => ({ ...s, dirty: false }));
    } catch (err) {
      console.error("save fallback falhou:", err);
      store.update(s => ({ ...s, dirty: true }));
      throw err;
    }
  }

  async function setFixedLayout(layout) {
    store.update(s => ({ ...s, layout,dirty: true }));
  
    const { course, grade, class_name } = parseClassId(
      get(store).classId
    );
  
    try {
      await apiFetch("/api/seating/preference", {
        method: "POST",
        body: JSON.stringify({
          course,
          grade,
          class_name,
          preferred_layout: layout
        })
      });
    } catch (err) {
      console.error("Erro ao salvar layout fixo:", err);
    }
  }

  

  return {
    subscribe: store.subscribe,
    loadSeating,
    loadStudents,
    loadAttendance,
    setStatus,
    showPhoto,
    hidePhoto,
    save,
    setFixedLayout
  };
}

export const attendanceStore = createAttendanceStore();
export const fixedLayout = writable(null);
