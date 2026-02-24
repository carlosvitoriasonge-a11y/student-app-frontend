<script>
    export const ssr = false;

    import { onMount } from "svelte";
    import { attendanceStore } from "$lib/stores/attendanceStore.js";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";

    export let params;

    const course = params.course;
    const grade = params.grade;
    const className = params.className;
    const classId = `${course}-${grade}-${className}`;

    // -----------------------------
    // ALUNOS (via store)
    // -----------------------------
    let students = [];
    $: students = ($attendanceStore.studentsInfo || [])
    .filter(s => s.status !== "休学")   // 🔥 filtra 休学
    .map(s => ({
        ...s,
        id: s.id.trim()
    }));


    // DEBUG: ver exatamente o que o Svelte está usando como ID 
    $: if (students.length > 0) { console.log( "STUDENTS IDS:", students.map((s) => s.id) ); }




    // -----------------------------
    // SUBJECTS
    // -----------------------------
    let subjects = [];
    let subjectGroups = {};
    let selectedSubject = null;

    let examFrequency = 1;
    let requiredReports = 0;

    let tasksData = [];
    let tasksDataAll = { "1st": [], "2nd": [] };

    let activeSemester = "1st";
    let currentYearKey = "";

    let showSubjectModal = false;
    let showTaskModal = false;

    let newTaskDate = "";
    let newTaskSemester = "1st";
    let newTaskLabel = "";

    const SUBJECT_ORDER = [
        "国語", "公民", "地理歴史", "数学", "理科",
        "英語", "保健体育", "芸術", "家庭", "情報", "総合探究"
    ];

    function sortSubjects(list) {
        return [...list].sort((a, b) => {
            const aMain = SUBJECT_ORDER.indexOf(a.name);
            const bMain = SUBJECT_ORDER.indexOf(b.name);
            if (aMain !== bMain) return aMain - bMain;
            return a.subject_group.localeCompare(b.subject_group, "ja");
        });
    }

    async function openSubjectModal() {
        showSubjectModal = true;
        const res = await apiFetch(`/api/subjects?course=${course}&grade=${grade}`);
        const data = res?.json ? await res.json() : res;

        subjects = sortSubjects(Array.isArray(data) ? data : []);

        subjectGroups = {};
        for (const s of subjects) {
            if (!subjectGroups[s.name]) subjectGroups[s.name] = [];
            subjectGroups[s.name].push(s);
        }
    }

    function selectSubject(s) {
        selectedSubject = s;
        examFrequency = Number(s.exam_frequency) || 1;
        requiredReports = s.required_reports ?? 0;
        showSubjectModal = false;
        activeSemester = "1st";
        loadTasks();
    }


    // -----------------------------
    // CARREGAR TASKS
    // -----------------------------
    async function loadTasks() {
    if (!selectedSubject) return;



    let baseYear = currentYearKey
    ? currentYearKey.split("_")[0]
    : schoolYearFromDate(new Date().toISOString().slice(0, 10));


    tasksDataAll = { "1st": [], "2nd": [] };

    // 前期
    const res1 = await apiFetch(
        `/api/tasks/class/${course}/${grade}/${className}/${baseYear}_1st/tasks?subject_id=${selectedSubject.id}`
    );
    const data1 = res1?.json ? await res1.json() : res1;

        //debug apagar depois
    console.log("DATA1 RAW:", JSON.stringify(data1, null, 2)); 

    // AQUI ESTÁ A CORREÇÃO
    tasksDataAll["1st"] = Array.isArray(data1)
        ? data1.map(t => ({
            date: t.date,
            label: t.label ?? "",
            submitted: Array.isArray(t.submitted) ? t.submitted : []
        }))
        : [];

    // 後期
    if (examFrequency === 4) {
        const res2 = await apiFetch(
            `/api/tasks/class/${course}/${grade}/${className}/${baseYear}_2nd/tasks?subject_id=${selectedSubject.id}`
        );
        const data2 = res2?.json ? await res2.json() : res2;

        tasksDataAll["2nd"] = Array.isArray(data2)
            ? data2.map(t => ({
                date: t.date,
                label: t.label ?? "",
                submitted: Array.isArray(t.submitted) ? t.submitted : []
            }))
            : [];
    }

    tasksData = tasksDataAll[activeSemester].map(t => ({
    ...t,
    submitted: [...t.submitted]
}));
currentYearKey = `${baseYear}_${activeSemester}`;
console.log("TASKSDATA QUE A TELA ESTÁ USANDO:", JSON.stringify(tasksData, null, 2));


}


function setSemester(sem) {
    activeSemester = sem;
    tasksData = tasksDataAll[sem].map(t => ({
        ...t,
        submitted: Array.isArray(t.submitted) ? [...t.submitted] : []
    }));
    const baseYear = currentYearKey
    ? currentYearKey.split("_")[0]
    : schoolYearFromDate(new Date().toISOString().slice(0, 10));

    currentYearKey = `${baseYear}_${activeSemester}`;
}


    function openTaskModal() {
        newTaskDate = "";
        newTaskLabel = "";
        newTaskSemester = activeSemester;
        showTaskModal = true;
    }

    async function createTask() {
        if (!newTaskDate) {
            alert("日付を選択してください。");
            return;
        }

        const baseYear = schoolYearFromDate(new Date().toISOString().slice(0, 10));
        const semester = examFrequency === 4 ? newTaskSemester : "1st";
        const yearKeyToUse = `${baseYear}_${semester}`;

        await apiFetch(
            `/api/tasks/class/${course}/${grade}/${className}/${yearKeyToUse}/${selectedSubject.id}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: newTaskDate,
                    label: newTaskLabel
                })
            }
        );

        activeSemester = semester;
        showTaskModal = false;
        await loadTasks();
    }

    async function toggleSubmit(studentId, taskIndex) {
    // 1) atualiza o estado local (Svelte) primeiro
    const t = tasksData[taskIndex];
    const submitted = Array.isArray(t.submitted) ? [...t.submitted] : [];

    if (submitted.includes(studentId)) {
        t.submitted = submitted.filter(id => id !== studentId);
    } else {
        t.submitted = [...submitted, studentId];
    }

    // força reatividade
    tasksData = [...tasksData];

    students = [...students]; // 🔥 força re-render do bloco de progress

    // 2) manda pro backend (sem recarregar tudo depois)
    await apiFetch(
        `/api/tasks/toggle/${course}/${grade}/${className}/${studentId}/${currentYearKey}/${selectedSubject.id}/${taskIndex}`,
        { method: "POST" }
    );
}




    async function editTaskLabel(yearKey, subjectId, index, newLabel) {
        await apiFetch(
            `/api/tasks/edit/${course}/${grade}/${className}/${yearKey}/${subjectId}/${index}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: "", label: newLabel })
            }
        );

        await loadTasks();
    }

    async function deleteTask(yearKey, subjectId, index) {
        await apiFetch(
            `/api/tasks/delete/${course}/${grade}/${className}/${yearKey}/${subjectId}/${index}`,
            { method: "DELETE" }
        );

        await loadTasks();
    }

    $: totalTasksAll =
        (tasksDataAll["1st"]?.length ?? 0) +
        (tasksDataAll["2nd"]?.length ?? 0);

    onMount(async () => {
        await attendanceStore.loadStudents(classId);
    });

    function countSubmittedForStudent(studentId) {
    const result = tasksData.reduce(
        (acc, t) => acc + (t.submitted && t.submitted.includes(studentId) ? 1 : 0),
        0
    );

    console.log("PROGRESS DEBUG:", {
        studentId,
        result,
        tasksData: tasksData.map(t => ({
            date: t.date,
            submitted: t.submitted
        }))
    });

    return result;
}

</script>

<h1>課題管理</h1>

<button on:click={openSubjectModal}>科目を選択</button>

{#if showSubjectModal}
    <div class="modal">
        <div class="modal-content">
            <h2>科目を選択</h2>
            {#each Object.keys(subjectGroups) as name}
                <h3>{name}</h3>
                {#each subjectGroups[name] as s}
                    <button on:click={() => selectSubject(s)}>{s.subject_group}</button>
                {/each}
            {/each}
            <button on:click={() => (showSubjectModal = false)}>閉じる</button>
        </div>
    </div>
{/if}

{#if selectedSubject}
    <h2>{selectedSubject.name}（{selectedSubject.subject_group}）</h2>

    <div class="stats-box">
        <div>必要課題数: {requiredReports}</div>
        <div>現在登録済み: {totalTasksAll}</div>

        {#if totalTasksAll < requiredReports}
            <div class="stats-warning">残り: {requiredReports - totalTasksAll}</div>
        {:else}
            <div class="stats-ok">（必要数を超えています）</div>
        {/if}
    </div>

    {#if examFrequency === 4}
        <div class="semester-buttons">
            <button on:click={() => setSemester("1st")} disabled={activeSemester === "1st"}>前期</button>
            <button on:click={() => setSemester("2nd")} disabled={activeSemester === "2nd"}>後期</button>
        </div>
    {/if}

    <button on:click={openTaskModal}>課題を設定する</button>

    <div class="table-wrapper">
        <table class="task-table">
            <thead>
                <tr>
                    <th class="col-name">生徒名</th>
                    <th class="col-progress">進捗</th>

                    {#each tasksData as t, i}
                    <th class="col-task"> 
                        <div class="task-date"> 
                            {#if t.date} 
                                {new Date(t.date).getMonth() + 1}/{new Date(t.date).getDate()} 
                            {/if} 
                        </div> 
                        
                        <div class="task-label-wrapper"> 
                            <input 
                                type="text" 
                                value={t.label} 
                                on:change={(e) => 
                                editTaskLabel( 
                                    currentYearKey, 
                                    selectedSubject.id, 
                                    i, 
                                    e.target.value 
                                ) 
                            } 
                            class="task-label-input" 
                        /> 
                    </div> 
                    
                    <div class="task-delete-wrapper"> 
                        <button 
                        class="task-delete-btn" 
                        on:click={() => { 
                            if (confirm("本当に削除しますか？")) { 
                                deleteTask(currentYearKey, selectedSubject.id, i); 
                            } 
                        }} 
                    > 
                        ✕ 
                    </button>

                        </th>
                    {/each}
                </tr>
            </thead>

            <tbody>
                {#each students as st}
                    <tr>
                        <td class="col-name">{st.name}</td>
                        <td class="col-progress"> 
                            {#if tasksData.length > 0} 
                                {countSubmittedForStudent(st.id)}/{tasksData.length} 
                            {/if}
                        </td>

                        {#each tasksData as t, i}
                            <td class="col-task">
                                <input
                                    type="checkbox"
                                    checked={t.submitted && t.submitted.includes(st.id)}
                                    on:change={() => toggleSubmit(st.id, i)}
                                />
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

{#if showTaskModal}
    <div class="modal">
        <div class="modal-content">
            <h2>課題を追加</h2>

            <label>日付</label>
            <input type="date" bind:value={newTaskDate} />

            <label>内容（任意）</label>
            <input type="text" bind:value={newTaskLabel} placeholder="例: 漢字プリント P.12〜15" />

            {#if examFrequency === 4}
                <label style="display:block; margin-top:8px;">区分</label>
                <label><input type="radio" bind:group={newTaskSemester} value="1st" /> 前期</label>
                <label style="margin-left: 10px;"><input type="radio" bind:group={newTaskSemester} value="2nd" /> 後期</label>
            {/if}

            <div style="margin-top: 12px;">
                <button on:click={createTask}>追加</button>
                <button on:click={() => (showTaskModal = false)}>閉じる</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
    }
    .modal-content {
        background: white;
        padding: 16px;
        border-radius: 4px;
        min-width: 280px;
    }

    .stats-box {
        margin: 10px 0;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
        width: fit-content;
    }
    .stats-warning { color: red; }
    .stats-ok { color: green; }

    .semester-buttons {
        margin-bottom: 10px;
    }

    .table-wrapper {
        width: 100%;
        overflow-x: auto;
        overflow-y: visible;
        border: 1px solid #ccc;
        padding-bottom: 4px;
        margin-top: 15px;
    }

    .task-table {
        border-collapse: collapse;
        min-width: max-content;
        background: white;
    }

    .col-name {
        position: sticky;
        left: 0;
        background: white;
        z-index: 10;
        min-width: 160px;
        max-width: 160px;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: break-word;
        font-weight: bold;
        border-right: 1px solid #ccc;
    }

    .col-progress {
        position: sticky;
        left: 160px;
        background: white;
        z-index: 9;
        min-width: 80px;
        max-width: 80px;
        text-align: center;
        white-space: nowrap;
        border-right: 1px solid #ccc;
    }

    .col-task {
    min-width: 80px;
    max-width: 80px;
    text-align: center;
    white-space: nowrap;
    padding: 4px;
    position: relative;
    
}


    .task-date {
        font-weight: bold;
        font-size: 12px;
    }

    .task-label-input {
        width: 95%;
        font-size: 10px;
        margin-top: 4px;
    }

    .task-delete-btn {
    display: inline-block;
    margin-top: 4px;
    z-index: 5;
    position: relative;
    
}


    table th, table td {
        padding: 4px 6px;
        background: white;
    }

    .task-delete-btn {
    display: inline-block;
    }

    .col-task {
    position: relative;
    }

    .task-table th {
    overflow: visible;
    }

    .task-label-wrapper {
    margin-top: 4px;
}

.task-delete-wrapper {
    margin-top: 4px;
}

.task-delete-btn {
    font-size: 12px;
    padding: 2px 6px;
}




</style>
