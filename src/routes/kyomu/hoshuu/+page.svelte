<script>
    export const ssr = false;

    import { onMount, tick } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";

    let today = new Date().toLocaleDateString("sv-SE");
    let sy = schoolYearFromDate(today);

    let loading = false;

    let selectedCourse = null;
    let selectedGrade = null;

    let alunosPendentes = [];

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

    const courseLabel = (c) => {
        if (c === "全") return "全日コース";
        if (c === "水") return "水曜日コース";
        if (c === "集") return "集中コース";
        return c;
    };

    async function selectCourseGrade(course, grade) {
        selectedCourse = course;
        selectedGrade = grade;
        alunosPendentes = [];
        loading = true;

        // 🔥 Carregar somente as turmas filtradas
        const classes = await apiFetch(
            `/api/classes?course=${course}&grade=${grade}`
        );

        let temp = [];

        for (const cls of classes) {
            const className = cls.class_name;
            const turmaLabel = `${grade}年${className}`;

            // 🔥 Carregar tudo em paralelo
            const [students, subjects, att, hoshuu] = await Promise.all([
                apiFetch(`/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`),
                apiFetch(`/api/subjects?course=${course}&grade=${grade}`),
                apiFetch(`/api/attendance_sub_special/special_sub?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`),
                apiFetch(`/api/hoshuu/get?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`)
            ]);

            // 🔥 Carregar tasks por matéria
            const yearKey = `${sy}_1st`;
            const tasksResults = await Promise.all(
                subjects.map(subj =>
                    apiFetch(`/api/tasks/class/${course}/${grade}/${className}/${yearKey}/tasks?subject_id=${subj.id}`)
                )
            );

            let tasksBySubject = {};
            subjects.forEach((subj, i) => {
                tasksBySubject[subj.id] = Array.isArray(tasksResults[i]) ? tasksResults[i] : [];
            });

            // 🔥 Processar alunos
            for (const st of students) {
                if (st.status === "休学") continue;

                const sid = st.id;
                let pendentes = [];

                for (const subj of subjects) {
                    const subjId = subj.id;
                    const subjName = subj.subject_group;

                    const required = subj.required_attendance ?? 0;
                    const valid = att[sid]?.[subjId]?.valid_attendance ?? 0;
                    const doneCount = (hoshuu[sid]?.[subjId] ?? []).length;

                    const faltam = Math.max(required - valid - doneCount, 0);

                    const tasks = tasksBySubject[subjId] ?? [];
                    const submittedCount = tasks.filter(t => t.submitted?.includes(sid)).length;

                    const requiredReports = subj.required_reports ?? 0;
                    const missingReports = Math.max(requiredReports - submittedCount, 0);

                    if (faltam > 0 || missingReports > 0) {
                        pendentes.push({
                            name: subjName,
                            faltam,
                            missingReports
                        });
                    }
                }

                if (pendentes.length > 0) {
                    temp.push({
                        turmaLabel,
                        className,
                        name: st.name,
                        attend_no: st.attend_no,
                        subjects: pendentes
                    });
                }
            }
        }

        // 🔥 Ordenar
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
            return Number(a.attend_no) - Number(b.attend_no);
        });

        alunosPendentes = temp;
        loading = false;
    }
</script>

<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 80px;
        font-size: 1.2em;
        color: #444;
    }

    .spinner {
        width: 60px;
        height: 60px;
        border: 6px solid #ddd;
        border-top-color: #3498db;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 20px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    th, td {
        padding: 6px 10px;
        border: 1px solid #ccc;
    }

    thead tr {
        background: #f0f0f0;
    }
</style>

<h1>補習対象者（出席・レポート）</h1>

<!-- 🔥 Botões de seleção -->
<div style="margin-bottom: 20px;">
    {#each courseButtons as btn}
        <button
            on:click={() => selectCourseGrade(btn.course, btn.grade)}
            style="margin: 4px; padding: 8px 12px;"
        >
            {btn.label}
        </button>
    {/each}
</div>

{#if loading}
<div class="loading-container">
    <div class="spinner"></div>
    <p>データを読み込んでいます…</p>
</div>
{:else if selectedCourse && selectedGrade}

<h2>【{courseLabel(selectedCourse)}・{selectedGrade}年】</h2>

{#if alunosPendentes.length === 0}
    <p>対象者なし</p>
{:else}

    <!-- Agrupar por turma -->
    {#each Array.from(new Set(alunosPendentes.map(a => a.turmaLabel))) as turma}

        <h3>[{turma}]</h3>

        <ol>
            {#each alunosPendentes.filter(a => a.turmaLabel === turma) as al}
                <li style="margin-bottom: 20px;">
                    <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 6px;">
                        {al.attend_no}番 {al.name}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>教科名</th>
                                <th style="text-align:center;">不足出席回数</th>
                                <th style="text-align:center;">不足レポート数</th>
                            </tr>
                        </thead>

                        <tbody>
                            {#each al.subjects as sb}
                                <tr>
                                    <td>{sb.name}</td>
                                    <td style="text-align:center;">{sb.faltam}</td>
                                    <td style="text-align:center;">{sb.missingReports}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </li>
            {/each}
        </ol>

    {/each}

{/if}

{/if}
