// src/lib/stores/attendanceSubStore.js
import { writable } from "svelte/store";
import { apiFetch } from "$lib/api";
import { parseClassId } from "$lib/stores/attendanceStore.js";

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
    seats: []
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
    console.log("BACKEND SEATING:", seating);

    // 1) pega o layout escolhido
    let selectedLayout = seating[preferred] || [];

    // 2) normaliza student_id
    let normalizedSeats = selectedLayout.map(seat => ({
      ...seat,
      student_id: seat?.student_id != null ? String(seat.student_id) : seat.student_id
    }));

    // ⭐⭐⭐ 3) ESPELHAMENTO — IGUAL AO HR ⭐⭐⭐
    if (normalizedSeats.length > 0) {
      const maxRow = Math.max(...normalizedSeats.map(s => Number(s.row)));
      const maxCol = Math.max(...normalizedSeats.map(s => Number(s.col)));

      normalizedSeats = normalizedSeats.map(s => ({
        ...s,
        row: maxRow - (Number(s.row) - 1),
        col: maxCol - (Number(s.col) - 1)
      }));
    }

    // 4) salva no store
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

      // normaliza
      let normalized = selected.map(seat => ({
        ...seat,
        student_id: seat?.student_id != null ? String(seat.student_id) : seat.student_id
      }));

      // ⭐⭐⭐ aplicar espelhamento igual ao HR ⭐⭐⭐
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

  return {
    subscribe: store.subscribe,
    loadSeatingMaps,
    setLayout
  };
}

export const attendanceSubStore = createAttendanceSubStore();
