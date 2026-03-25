<script>
    export const ssr = false;
  
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";
  
    let today = new Date().toLocaleDateString("sv-SE");
    let sy = schoolYearFromDate(today);
  
    let loading = true;
    let alunos = [];
  
    let showCalendarModal = false;
    let modalTarget = null;
    let modalDate = "";
  
    // -------------------------------------------------------
    // 1) Carregar sairishuu.json + dados dos alunos + matérias
    // -------------------------------------------------------
    async function loadSairishuu() {
      loading = true;
  
      const raw = await apiFetch("/api/sairishuu/get");
      const sairishuu = raw?.json ? await raw.json() : raw;
  
      alunos = [];
  
      for (const studentId of Object.keys(sairishuu)) {
        const subjects = sairishuu[studentId];
  
        // aluno
        const stRes = await apiFetch(`/api/students/${studentId}`);
        const aluno = stRes?.json ? await stRes.json() : stRes;
  
        // turma
        const classRes = await apiFetch(`/api/students/${studentId}`);
const turma = classRes?.json ? await classRes.json() : classRes;

  
        for (const subjectId of Object.keys(subjects)) {
          const entry = subjects[subjectId];

          if (entry.status === "passed") continue;
  
          // matéria
          const allSubjects = await apiFetch(`/api/subjects?course=${aluno.course}&grade=${aluno.grade}`);


          const subject = allSubjects.find(s => s.id === subjectId);
  
          const required = subject.required_attendance ?? 0;
          const doneDates = entry.done_dates ?? []; // se quiser salvar datas no futuro
          const done = doneDates.length;
          const faltam = Math.max(required - done, 0);
  
          alunos.push({
            student_id: studentId,
            name: aluno.name,
            attend_no: aluno.attend_no,
            className: turma.class_name,
            turmaLabel: `${turma.grade}年${turma.class_name}`,
            subject_id: subjectId,
            subject_name: subject.name,
            subject_group: subject.subject_group,
            required,
            doneDates,
            faltam
          });
        }
      }
  
      // ordenar por turma → número de chamada
      alunos.sort((a, b) => {
        if (a.turmaLabel !== b.turmaLabel) return a.turmaLabel.localeCompare(b.turmaLabel, "ja");
        return Number(a.attend_no) - Number(b.attend_no);
      });
  
      loading = false;
    }
  
    // -------------------------------------------------------
    // 2) Abrir modal ao clicar no checkbox
    // -------------------------------------------------------
    function marcarRishuuUnit(al) {
      modalTarget = al;
      modalDate = "";
      showCalendarModal = true;
    }
  
    // -------------------------------------------------------
    // 3) Registrar data → done++ → se done == required → complete
    // -------------------------------------------------------
    async function confirmarRishuu() {
    if (!modalDate || !modalTarget) return;

    const al = modalTarget;

    // 1) salvar 1 回 no backend
    await apiFetch("/api/sairishuu/add_date", {
        method: "POST",
        body: JSON.stringify({
            student_id: al.student_id,
            subject_id: al.subject_id,
            date: modalDate
        })
    });

    // 2) recarregar dados atualizados
    await loadSairishuu();

    // 3) pegar o aluno atualizado
    const atualizado = alunos.find(
        x => x.student_id === al.student_id && x.subject_id === al.subject_id
    );

    // 4) se completou todos os required → marcar como passed
    if (atualizado.doneDates.length >= atualizado.required) {
        await apiFetch("/api/sairishuu/complete", {
            method: "POST",
            body: JSON.stringify({
                student_id: atualizado.student_id,
                subject_id: atualizado.subject_id,
                school_year: `${sy}年度`
            })
        });

        // recarregar de novo para refletir o passed
        await loadSairishuu();
    }

    // 5) fechar modal
    showCalendarModal = false;
    modalTarget = null;
    modalDate = "";
}



  
    onMount(loadSairishuu);
  </script>
  
  <h1>再履修管理</h1>
  
  {#if loading}
    <p>読み込み中...</p>
  {:else if alunos.length === 0}
    <p>再履修中の生徒はいません。</p>
  {:else}
    {#each Array.from(new Set(alunos.map(a => a.turmaLabel))) as turma}
      <h3 style="margin-top: 20px;">{turma}</h3>
  
      <ul>
        {#each alunos.filter(a => a.turmaLabel === turma) as al}
          <li style="margin-bottom: 16px;">
  
            <!-- Nome + checkboxes -->
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 200px; font-weight: bold;">
                {al.attend_no}番 {al.name}
                <div style="font-size: 0.9em; color: #666;">
                    {al.subject_group}
                  </div>
              </div>
  
              <div style="display: flex; gap: 8px;">
                {#each Array(al.faltam) as _, i}
                  <label
                    style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      width: 42px;
                      height: 42px;
                      border-radius: 8px;
                      background: #f5f5f5;
                      border: 1px solid #ccc;
                    "
                    on:mousedown|preventDefault={() => marcarRishuuUnit(al)}
                  >
                    <input
                      type="checkbox"
                      style="width: 28px; height: 28px; transform: scale(1.4); pointer-events: none;"
                    />
                  </label>
                {/each}
              </div>
            </div>
  
            <!-- faltam -->
            <div style="margin-left: 4px; margin-top: 4px; font-size: 0.9em; color: #444;">
              再履修必要回数: {al.faltam}
            </div>
  
            <!-- datas já concluídas -->
            {#if al.doneDates.length > 0}
              <table style="margin-left: 20px; margin-top: 6px; border-collapse: collapse; font-size: 0.9em;">
                <tbody>
                  <tr>
                    <th style="padding: 4px 8px; border: 1px solid #ccc; background: #f7f7f7;">再履修日</th>
                    {#each al.doneDates as d}
                      <td style="padding: 4px 8px; border: 1px solid #ccc; text-align: center;">
                        {d}
                      </td>
                    {/each}
                  </tr>
                </tbody>
              </table>
            {/if}
  
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
  
  <!-- Modal -->
  {#if showCalendarModal}
    <div style="
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; justify-content: center; align-items: center;
      z-index: 9999;
    ">
      <div style="
        background: #fff;
        width: 90%; max-width: 600px; height: 70%;
        border-radius: 20px; padding: 30px;
        display: flex; flex-direction: column; justify-content: space-between;
      ">
        <div style="text-align: center;">
          <h2 style="font-size: 1.8em; margin-bottom: 20px;">再履修日を選択</h2>
  
          <input
            type="date"
            bind:value={modalDate}
            style="width: 100%; font-size: 1.6em; padding: 14px; border-radius: 12px; border: 1px solid #ccc;"
          />
        </div>
  
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <button
            on:click={() => { showCalendarModal = false; modalTarget = null; }}
            style="flex: 1; margin-right: 10px; padding: 18px 0; font-size: 1.4em; border-radius: 12px; background: #ccc;"
          >
            キャンセル
          </button>
  
          <button
            on:click={confirmarRishuu}
            style="flex: 1; margin-left: 10px; padding: 18px 0; font-size: 1.4em; border-radius: 12px; background: #4CAF50; color: white;"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  {/if}
  