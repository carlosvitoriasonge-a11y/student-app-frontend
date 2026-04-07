// src/lib/stores/attendanceSubStore.js
import { writable, get } from "svelte/store";
import { apiFetch } from "$lib/api";
import { parseClassId } from "$lib/stores/attendanceStore.js";

export const UNRECORDED = "未記録";

function createAttendanceSubStore() {
  const store = writable({
    classId: "",
    layout: "auto",
    seatingMaps: {
      auto: [],
      custom: [],
      A: [],
      B: [],
      C: []
    },
    seats: [],

    // 🔥 PRESENÇA DO SUB
    date: "",
    period: "",
    students: {},        // mapa de presença
    subject: "",
    examFrequency: null,
    dirty: false
  });

  // ============================================================
  // LOAD SEATING MAPS (auto/custom/A/B/C)
  // ============================================================
  async function loadSeatingMaps(classId, preferred = "auto") {
    const { course, grade, class_name } = parseClassId(classId);

    const res = await apiFetch(
      `/api/students/seating?course=${encodeURIComponent(course)}&grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(class_name)}`
    );

    const seating = res?.json ? await res.json() : res;

    let selectedLayout = seating[preferred] || [];

    let normalizedSeats = selectedLayout.map(seat => ({
      ...seat,
      student_id: seat?.student_id != null ? String(seat.student_id) : seat.student_id
    }));

    if (normalizedSeats.length > 0) {
      const maxRow = Math.max(...normalizedSeats.map(s => Number(s.row)));
      const maxCol = Math.max(...normalizedSeats.map(s => Number(s.col)));

      normalizedSeats = normalizedSeats.map(s => ({
        ...s,
        row: maxRow - (Number(s.row) - 1),
        col: maxCol - (Number(s.col) - 1)
      }));
    }

    store.update(s => ({
      ...s,
      classId,
      seatingMaps: {
        auto: seating.auto || [],
        custom: seating.custom || [],
        A: seating.A || [],
        B: seating.B || [],
        C: seating.C || []
      },
      layout: preferred,
      seats: normalizedSeats
    }));
  }

  // ============================================================
  // SWITCH LAYOUT (auto/custom/A/B/C)
  // ============================================================
  function setLayout(layout) {
    store.update(s => {
      let selected = s.seatingMaps[layout] || [];

      let normalized = selected.map(seat => ({
        ...seat,
        student_id: seat?.student_id != null ? String(seat.student_id) : seat.student_id
      }));

      if (normalized.length > 0) {
        const maxRow = Math.max(...normalized.map(s => Number(s.row)));
        const maxCol = Math.max(...normalized.map(s => Number(s.col)));

        normalized = normalized.map(s => ({
          ...s,
          row: maxRow - (Number(s.row) - 1),
          col: maxCol - (Number(s.col) - 1)
        }));
      }

      return {
        ...s,
        layout,
        seats: normalized
      };
    });
  }

  // ============================================================
  // 🔥 LOAD ATTENDANCE SUB (PRESENÇA)
  // ============================================================
  async function loadAttendanceSub(classId, date, period) {
    const { course, grade, class_name } = parseClassId(classId);

    const res = await apiFetch(
      `/api/attendance_sub?date=${date}&course=${encodeURIComponent(course)}&grade=${encodeURIComponent(
        grade
      )}&class_name=${encodeURIComponent(class_name)}`
    );

    const dayData = res?.classes?.[classId]?.[date] || {};
    const periodData = dayData[period] || {};

    store.update(s => ({
      ...s,
      classId,
      date,
      period,
      students: { ...(periodData.students || {}) },
      subject: periodData.subject || "",
      examFrequency: periodData.exam_frequency ?? null,
      dirty: false
    }));
  }

  // ============================================================
  // 🔥 SET STATUS
  // ============================================================
  function setStatus(studentId, nextStatus) {
    store.update(s => ({
      ...s,
      students: { ...s.students, [studentId]: nextStatus },
      dirty: true
    }));
  }

  // ============================================================
  // 🔥 TOGGLE ALL
  // ============================================================
  function toggleAll(cycleFn, studentsInfo) {
    const state = get(store);
    const updated = { ...state.students };

    for (const st of studentsInfo) {
      const sid = String(st.id ?? st.student_id);
      const current = updated[sid] ?? UNRECORDED;
      updated[sid] = cycleFn(current);
    }

    store.update(s => ({
      ...s,
      students: updated,
      dirty: true
    }));
  }

  // ============================================================
  // 🔥 RESET DAY (O QUE VOCÊ QUER)
  // ============================================================
  function resetSeats() {
    store.update(s => ({
      ...s,
      seats: s.seats.map(seat => ({
        ...seat,
        student_id: null   // 🔥 ZERA O ALUNO DO SEAT
      }))
    }));
  }
  

  // ============================================================
  // 🔥 SAVE
  // ============================================================
  async function save() {
    const s = get(store);

    const payload = {
      date: s.date,
      period: s.period,
      subject: s.subject,
      exam_frequency: s.examFrequency,
      classes: {
        [s.classId]: {
          students: s.students
        }
      }
    };

    await apiFetch("/api/attendance_sub/save", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    store.update(st => ({ ...st, dirty: false }));
  }

  return {
    subscribe: store.subscribe,
    loadSeatingMaps,
    setLayout,

    // 🔥 PRESENÇA
    loadAttendanceSub,
    setStatus,
    toggleAll,
    save,

    resetSeats
  };
}

export const attendanceSubStore = createAttendanceSubStore();
