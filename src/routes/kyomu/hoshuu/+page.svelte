<script>
    export const ssr = false;

    import { onMount, tick } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";

    let today = new Date().toLocaleDateString("sv-SE");
    let sy = schoolYearFromDate(today);

    let loading = true;

    let resultado = {
        "全": {},
        "水": {},
        "集": {}
    };

    onMount(async () => {
        loading = true;

        const classes = await apiFetch(`/api/classes`);

        resultado = { "全": {}, "水": {}, "集": {} };

        for (const cls of classes) {
            const course = cls.course;
            const grade = cls.grade;
            const className = cls.class_name;

            const turmaLabel = `${grade}年${className}`;

            // cria a turma vazia e força renderização parcial
            resultado[course][turmaLabel] = [];
            await tick();

            // 🔥 CARREGAMENTO PARALELO (4 chamadas simultâneas)
            const [students, subjects, att, hoshuu] = await Promise.all([
                apiFetch(`/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`),
                apiFetch(`/api/subjects?course=${course}&grade=${grade}`),
                apiFetch(`/api/attendance_sub_special/special_sub?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`),
                apiFetch(`/api/hoshuu/get?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`)
            ]);

            // 🔥 CARREGAR TASKS EM PARALELO
            const yearKey = `${sy}_1st`;

            const tasksResults = await Promise.all(
                subjects.map(subj =>
                    apiFetch(`/api/tasks/class/${course}/${grade}/${className}/${yearKey}/tasks?subject_id=${subj.id}`)
                )
            );

            let tasksBySubject = {};
            subjects.forEach((subj, i) => {
                const tasks = tasksResults[i];
                tasksBySubject[subj.id] = Array.isArray(tasks) ? tasks : [];
            });

            // 🔥 PROCESSAR ALUNOS
            for (const st of students) {
                if (st.status === "休学") continue;

                const sid = st.id;
                let pendentes = [];

                for (const subj of subjects) {
                    const subjId = subj.id;
                    const subjName = subj.subject_group;
                    const required = subj.required_attendance ?? 0;

                    // presença válida
                    let valid = 0;
                    if (att[sid] && att[sid][subjId]) {
                        valid = att[sid][subjId].valid_attendance ?? 0;
                    }

                    // hoshuu
                    const doneDates = hoshuu[sid]?.[subjId] ?? [];
                    const doneCount = doneDates.length;

                    const faltam = Math.max(required - valid - doneCount, 0);

                    // relatórios
                    const tasks = tasksBySubject[subjId] ?? [];

                    let submittedCount = 0;
                    for (const t of tasks) {
                        if (Array.isArray(t.submitted) && t.submitted.includes(sid)) {
                            submittedCount++;
                        }
                    }

                    let requiredReports = subj.required_reports ?? 0;
                    if (tasksBySubject[subjId] && tasksBySubject[subjId].required) {
                        requiredReports = tasksBySubject[subjId].required;
                    }

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
                    resultado[course][turmaLabel].push({
                        name: st.name,
                        attend_no: st.attend_no,
                        subjects: pendentes
                    });
                }
            }

            // ordenar alunos
            resultado[course][turmaLabel].sort((a, b) => {
                const clean = (v) => Number(String(v).replace(/[^\d]/g, ""));
                return clean(a.attend_no) - clean(b.attend_no);
            });
        }

        // 🔥 ORDENAR TURMAS
        for (const curso of ["全", "水", "集"]) {
            const turmasOrdenadas = Object.keys(resultado[curso]).sort((a, b) => {
                const extract = (label) => {
                    const match = label.match(/(\d+)年(.+)/);
                    return match
                        ? { grade: Number(match[1]), className: match[2] }
                        : { grade: 999, className: label };
                };

                const A = extract(a);
                const B = extract(b);

                if (A.grade !== B.grade) return A.grade - B.grade;
                return A.className.localeCompare(B.className, "ja");
            });

            const novo = {};
            for (const t of turmasOrdenadas) {
                novo[t] = resultado[curso][t];
            }
            resultado[curso] = novo;
        }

        loading = false;
    });

    const courseLabel = (c) => {
        if (c === "全") return "全日コース";
        if (c === "水") return "水曜日コース";
        if (c === "集") return "集中コース";
        return c;
    };
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

    /* 🔥 CSS GLOBAL PARA A TABELA */
    :global(table) {
        width: 100%;
        border-collapse: collapse;
        margin-left: 10px;
        margin-bottom: 10px;
        font-size: 1em;
    }

    :global(th), :global(td) {
        padding: 6px 10px;
        border: 1px solid #ccc;
    }

    :global(thead tr) {
        background: #f0f0f0;
    }
</style>


<h1>補習対象者（出席・レポート）【全校】</h1>

{#if loading}
<div class="loading-container">
    <div class="spinner"></div>
    <p>データを読み込んでいます…</p>
</div>
{:else}

    {#each ["全", "水", "集"] as curso}

        <h1 style="margin-top: 40px;">【{courseLabel(curso)}】</h1>

        {#each Object.entries(resultado[curso]) as [turma, alunos]}
            <h2>[{turma}] （{alunos.length}名）</h2>

            {#if alunos.length === 0}
                <p>対象者なし</p>
            {:else}
                <ol>
                    {#each alunos as al}
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
            {/if}
        {/each}

    {/each}

{/if}
