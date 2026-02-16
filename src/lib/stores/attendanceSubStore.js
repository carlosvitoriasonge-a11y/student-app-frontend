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


    // seating = { auto: [...], custom: [...], A: [...], B: [...], C: [...] }

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
      seats: seating[preferred] || []
    }));
  }

  // ============================================================
  // SWITCH LAYOUT (auto/custom/A/B/C)
  // ============================================================
  function setLayout(layout) {
    store.update(s => ({
      ...s,
      layout,
      seats: s.seatingMaps[layout] || []
    }));
  }

  return {
    subscribe: store.subscribe,
    loadSeatingMaps,
    setLayout
  };
}

export const attendanceSubStore = createAttendanceSubStore();
