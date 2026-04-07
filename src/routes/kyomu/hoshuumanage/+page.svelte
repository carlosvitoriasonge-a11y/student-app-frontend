<script>
    export const ssr = false;

    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";

    let today = new Date().toLocaleDateString("sv-SE");
    let sy = schoolYearFromDate(today);

    let loading = false;

    let selectedCourse = null;
    let selectedGrade = null;
    let subjects = [];
    let selectedSubject = null;

    let showCalendarModal = false;
    let modalTargetAluno = null;
    let modalDate = "";

    let alunosPendentes = [];

    function marcarHoshuuUnit(al, index) {
        modalTargetAluno = al;
        modalDate = "";
        showCalendarModal = true;
    }

    const courseLabel = (c) => {
        if (c === "全") return "全日コース";
        if (c === "水") return "水曜日コース";
        if (c === "集") return "集中コース";
        return c;
    };

    const gradeLabel = (g) => `${g}年生`;

    const courseButtons = [
        { course: "全", grade: 1, label: "全日１年生" },
        { course: "全", grade: 2, label: "全日２年生" },
        { course: "全", grade: 3, label: "全日３年生" },
        { course: "水", grade: 1, label: "水曜日１年生" },
        { course: "水", grade: 2, label: "水曜日２年生" },
        { course: "水", grade: 3, label: "水曜日３年生" },
        { course: "集", grade: 1, label: "集中１年生" },
        { course: "集", grade: 2, label: "集中２年生" },
        { course: "集", grade: 3, label: "集中３年生" }
    ];

    async function selectCourseGrade(course, grade) {
        selectedCourse = course;
        selectedGrade = grade;
        selectedSubject = null;
        alunosPendentes = [];
        loading = true;

        subjects = await apiFetch(
            `/api/subjects?course=${course}&grade=${grade}`
        );

        // 🔥 remover matérias opcionais
        subjects = subjects.filter(s => (s.required_attendance ?? 0) > 0);

        loading = false;
    }

    async function loadSubject(subj) {
        selectedSubject = subj;
        alunosPendentes = [];
        loading = true;

        const classes = await apiFetch(
            `/api/classes?course=${selectedCourse}&grade=${selectedGrade}`
        );

        let temp = [];

        for (const cls of classes) {
            const className = cls.class_name;
            const turmaLabel = `${selectedGrade}年${className}`;

            const students = await apiFetch(
                `/api/students/by_class?course=${selectedCourse}&grade=${selectedGrade}&class_name=${className}`
            );

            const att = await apiFetch(
                `/api/attendance_sub_special/special_sub?course=${selectedCourse}&grade=${selectedGrade}&class_name=${className}&sy=${sy}`
            );

            const hoshuu = await apiFetch(
                `/api/hoshuu/get?course=${selectedCourse}&grade=${selectedGrade}&class_name=${className}&sy=${sy}`
            );

            // 🔥 CARREGAR TASKS DA MATÉRIA
            const yearKey = `${sy}_1st`;
            const resTasks = await apiFetch(
                `/api/tasks/class/${selectedCourse}/${selectedGrade}/${className}/${yearKey}/tasks?subject_id=${subj.id}`
            );
            const tasks = resTasks?.json ? await resTasks.json() : resTasks;

            for (const st of students) {
                if (st.status === "休学") continue;

                const sid = st.id;

                // --------- 出席不足 ----------
                const stats = att[sid]?.[subj.id];
                const required = subj.required_attendance ?? 0;
                const valid = stats?.valid_attendance ?? 0;

                const doneDates = hoshuu[sid]?.[subj.id] ?? [];
                const doneCount = doneDates.length;

                const faltam = Math.max(required - valid - doneCount, 0);

                // --------- レポート不足 ----------
                let submittedCount = 0;
                for (const t of tasks) {
                    if (Array.isArray(t.submitted) && t.submitted.includes(sid)) {
                        submittedCount++;
                    }
                }

                const requiredReports = subj.required_reports ?? 0;
                const missingReports = Math.max(requiredReports - submittedCount, 0);

                // --------- FILTRAR: só aparece se tiver pendência ----------
                if (faltam > 0 || missingReports > 0) {
                    temp.push({
                        className,
                        turmaLabel,
                        name: st.name,
                        attend_no: st.attend_no,
                        sid,
                        subject_id: subj.id,
                        faltam,
                        missingReports,
                        doneDates
                    });
                }
            }
        }

        // ordenar
        temp.sort((a, b) => {
            if (a.turmaLabel !== b.turmaLabel) {
                const extract = (label) => {
                    const match = label.match(/(\d+)年(.+)/);
                    return match ? { grade: Number(match[1]), className: match[2] } : { grade: 999, className: label };
                };
                const A = extract(a.turmaLabel);
                const B = extract(b.turmaLabel);
                if (A.grade !== B.grade) return A.grade - B.grade;
                return A.className.localeCompare(B.className, "ja");
            }
            const clean = (v) => Number(String(v).replace(/[^\d]/g, ""));
            return clean(a.attend_no) - clean(b.attend_no);
        });

        alunosPendentes = temp;
        loading = false;
    }

    // 🔥 NOVA FUNÇÃO — 1 checkbox = 1 補習回
    async function confirmarHoshuu() {
        if (!modalDate || !modalTargetAluno) return;

        const al = modalTargetAluno;

        await apiFetch("/api/hoshuu/save", {
            method: "POST",
            body: JSON.stringify({
                student_id: al.sid,
                subject_id: al.subject_id,
                date: modalDate,
                course: selectedCourse,
                grade: selectedGrade,
                class_name: al.className,
                sy
            })
        });

        // atualizar localmente
        al.doneDates = [...al.doneDates, modalDate];
        al.faltam = Math.max(al.faltam - 1, 0);

        alunosPendentes = [...alunosPendentes];

        showCalendarModal = false;
        modalTargetAluno = null;
        modalDate = "";
    }

    function formatShortDate(d) {
        const [y, m, day] = d.split("-");
        return `${Number(m)}/${Number(day)}`;
    }

</script>

<h1>補習管理画面</h1>

<div style="margin-bottom: 20px;">
    {#each courseButtons as btn}
        <button
            on:click={() => selectCourseGrade(btn.course, btn.grade)}
            style="
                margin: 4px;
                padding: 6px 10px;
                border-radius: 4px;
                border: 1px solid #ccc;
                background-color: {selectedCourse === btn.course && selectedGrade === btn.grade ? '#eef' : '#fff'};
            "
        >
            {btn.label}
        </button>
    {/each}
</div>

{#if selectedCourse && selectedGrade}
    <h2>
        対象：{courseLabel(selectedCourse)} {gradeLabel(selectedGrade)}
    </h2>

    <h3>科目一覧</h3>

    {#if loading && !selectedSubject}
        <p>読み込み中...</p>
    {:else if subjects.length === 0}
        <p>科目なし</p>
    {:else}
    <ul style="display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0;">

            {#each subjects as subj}
            <li style="margin: 0;">

                    <button
                        on:click={() => loadSubject(subj)}
                        style="
                            margin: 2px 0;
                            padding: 4px 8px;
                            border-radius: 4px;
                            border: 1px solid #ccc;
                            background-color: {selectedSubject && selectedSubject.id === subj.id ? '#efe' : '#fff'};
                        "
                    >
                        {subj.subject_group}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}

    {#if selectedSubject}
        <h3 style="margin-top: 20px;">
            補習対象者 — {selectedSubject.subject_group}
        </h3>

        {#if loading}
            <p>読み込み中...</p>
        {:else if alunosPendentes.length === 0}
            <p>対象者なし</p>
        {:else}
            {#each Array.from(new Set(alunosPendentes.map(a => a.turmaLabel))) as turma}
                <h4 style="margin-top: 16px;">{turma}</h4>

                <ul>
                    {#each alunosPendentes.filter(a => a.turmaLabel === turma) as al}
                    <li style="margin-bottom: 16px;">

                        <!-- 🔥 LINHA COM DUAS COLUNAS: NOME + CHECKBOXES -->
                        <div
                            style="
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            "
                        >
                            <!-- 🔥 COLUNA FIXA PARA NOME -->
                            <div
                                style="
                                    width: 200px;
                                    min-width: 200px;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    font-weight: bold;
                                "
                            >
                                {al.attend_no}番 {al.name}
                            </div>
                    
                            <!-- 🔥 CHECKBOXES -->
                            <div style="display: flex; gap: 8px;">
                                {#if al.faltam > 0}
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
                                                touch-action: manipulation;
                                            "
                                            on:mousedown|preventDefault={() => marcarHoshuuUnit(al, i)}
                                        >
                                            <input
                                                type="checkbox"
                                                style="
                                                    width: 28px;
                                                    height: 28px;
                                                    transform: scale(1.4);
                                                    pointer-events: none;
                                                "
                                            />
                                        </label>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    
                        <!-- 🔥 LINHA COM FALTAM + LINK PARA REPORTS -->
                        <div style="margin-left: 4px; margin-top: 4px; font-size: 0.9em; color: #444;">
                            受講不足回数: {al.faltam}

                            <a
    href={`/class/${selectedCourse}/${selectedGrade}/${al.className}/reports`}
    style="
        margin-left: 12px;
        color: #0066cc;
        text-decoration: underline;
        cursor: pointer;
    "
>
    不足レポート数: {al.missingReports}
</a>

                        </div>
                    
                        <!-- 🔥 MINI-TABLE DE 補習日 -->
                        {#if al.doneDates.length > 0}
                            <table
                                style="
                                    margin-left: 20px;
                                    margin-top: 6px;
                                    border-collapse: collapse;
                                    font-size: 0.9em;
                                    width: auto;
                                "
                            >
                                <tbody>
                                    <tr>
                                        <th
                                            style="
                                                padding: 4px 8px;
                                                border: 1px solid #ccc;
                                                background: #f7f7f7;
                                                white-space: nowrap;
                                            "
                                        >
                                            補習日
                                        </th>
                    
                                        {#each al.doneDates as d}
                                            <td
                                                style="
                                                    padding: 4px 8px;
                                                    border: 1px solid #ccc;
                                                    text-align: center;
                                                    white-space: nowrap;
                                                "
                                            >
                                                {formatShortDate(d)}
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
    {/if}
{/if}

{#if showCalendarModal}
<div style="
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
">

    <div style="
        background: #fff;
        width: 90%;
        max-width: 600px;
        height: 70%;
        border-radius: 20px;
        padding: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
    ">

        <div style="text-align: center;">
            <h2 style="font-size: 1.8em; margin-bottom: 20px;">
                補習日を選択
            </h2>

            <input
                type="date"
                bind:value={modalDate}
                style="
                    width: 100%;
                    font-size: 1.6em;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid #ccc;
                "
            />
        </div>

        <div style="
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        ">
            <button
                on:click={() => { showCalendarModal = false; modalTargetAluno = null; }}
                style="
                    flex: 1;
                    margin-right: 10px;
                    padding: 18px 0;
                    font-size: 1.4em;
                    border-radius: 12px;
                    border: none;
                    background: #ccc;
                "
            >
                キャンセル
            </button>

            <button
                on:click={confirmarHoshuu}
                style="
                    flex: 1;
                    margin-left: 10px;
                    padding: 18px 0;
                    font-size: 1.4em;
                    border-radius: 12px;
                    border: none;
                    background: #4CAF50;
                    color: white;
                "
            >
                登録
            </button>
        </div>

    </div>
</div>
{/if}
