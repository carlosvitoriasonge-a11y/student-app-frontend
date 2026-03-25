<script>
    export const ssr = false;

    import { onMount } from "svelte";
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

            const students = await apiFetch(
                `/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`
            );

            const subjects = await apiFetch(
                `/api/subjects?course=${course}&grade=${grade}`
            );

            const att = await apiFetch(
                `/api/attendance_sub_special/special_sub?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`
            );

            // 🔥 HOSHUU
            const hoshuu = await apiFetch(
                `/api/hoshuu/get?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`
            );

            // 🔥 CARREGAR TASKS POR MATÉRIA (1st semestre)
            let tasksBySubject = {};
            for (const subj of subjects) {
                const subjId = subj.id;
                const yearKey = `${sy}_1st`;

                const res = await apiFetch(
                    `/api/tasks/class/${course}/${grade}/${className}/${yearKey}/tasks?subject_id=${subjId}`
                );

                const tasks = res?.json ? await res.json() : res;
                tasksBySubject[subjId] = Array.isArray(tasks) ? tasks : [];
            }

            if (!resultado[course][turmaLabel]) {
                resultado[course][turmaLabel] = [];
            }

            for (const st of students) {
                if (st.status === "休学") continue;

                const sid = st.id;
                let pendentes = [];

                for (const subj of subjects) {
                    const subjId = subj.id;
                    const subjName = subj.subject_group;
                    const required = subj.required_attendance ?? 0;

                    let valid = 0;

                    if (att[sid] && att[sid][subjId]) {
                        const groups = att[sid][subjId];
                        valid = groups.valid_attendance ?? 0;
                    }

                    // 🔥 HOSHUU
                    const doneDates = hoshuu[sid]?.[subjId] ?? [];
                    const doneCount = doneDates.length;

                    const faltam = Math.max(required - valid - doneCount, 0);

                    // 🔥 CALCULAR RELATÓRIOS PENDENTES
                    // 🔥 CALCULAR RELATÓRIOS PENDENTES
const tasks = tasksBySubject[subjId] ?? [];

// 分子: quantos o aluno entregou
let submittedCount = 0;
for (const t of tasks) {
    if (Array.isArray(t.submitted) && t.submitted.includes(sid)) {
        submittedCount++;
    }
}

// 分母: mínimo requerido de reports
// prioridade: subject.required_reports (do subjects) → subject.required (do JSON de tasks) → 0
let requiredReports = subj.required_reports ?? 0;

// se o JSON de tasks tiver "required" preenchido, ele manda na frente
if (tasksBySubject[subjId] && tasksBySubject[subjId].required) {
    requiredReports = tasksBySubject[subjId].required;
}

const missingReports = Math.max(requiredReports - submittedCount, 0);


                    // 🔥 SE FALTAR PRESENÇA OU RELATÓRIO → ENTRA NA LISTA
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

<h1>補習対象者（出席・レポート）【全校】</h1>

{#if loading}
    <p>読み込み中...</p>
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
            
                        <table
                            style="
                                width: 100%;
                                border-collapse: collapse;
                                margin-left: 10px;
                                margin-bottom: 10px;
                                font-size: 1em;
                            "
                        >
                            <thead>
                                <tr style="background: #f0f0f0;">
                                    <th style="padding: 6px 10px; border: 1px solid #ccc; text-align: left; width: 50%;">
                                        教科名
                                    </th>
                                    <th style="padding: 6px 10px; border: 1px solid #ccc; text-align: center; width: 25%;">
                                        不足出席回数
                                    </th>
                                    <th style="padding: 6px 10px; border: 1px solid #ccc; text-align: center; width: 25%;">
                                        不足レポート数
                                    </th>
                                </tr>
                            </thead>
            
                            <tbody>
                                {#each al.subjects as sb}
                                    <tr>
                                        <td style="padding: 6px 10px; border: 1px solid #ccc;">
                                            {sb.name}
                                        </td>

                                        <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: center;">
                                            {sb.faltam}
                                        </td>

                                        <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: center;">
                                            {sb.missingReports}
                                        </td>
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
