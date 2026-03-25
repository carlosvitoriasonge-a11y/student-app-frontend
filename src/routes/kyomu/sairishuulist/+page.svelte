<script>
    export const ssr = false;

    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let selectedNendo = "";
    let loading = false;
    let alunos = [];
    let nendos = [];

    // 🔥 1) Carregar lista REAL de 年度 existentes
    async function loadNendos() {
        const raw = await apiFetch("/api/sairishuu/get");
        const sairishuu = raw?.json ? await raw.json() : raw;

        nendos = Array.from(
            new Set(
                Object.values(sairishuu)
                    .flatMap(student => Object.values(student))
                    .filter(entry => entry.status === "passed" && entry.school_year)
                    .map(entry => entry.school_year)
            )
        ).sort();
    }

    // 🔥 2) Carregar alunos passed do 年度 selecionado
    async function loadPassed() {
        if (!selectedNendo) return;

        loading = true;

        const raw = await apiFetch("/api/sairishuu/get");
        const sairishuu = raw?.json ? await raw.json() : raw;

        alunos = [];

        for (const studentId of Object.keys(sairishuu)) {
            const subjects = sairishuu[studentId];

            const stRes = await apiFetch(`/api/students/${studentId}`);
            const aluno = stRes?.json ? await stRes.json() : stRes;

            const turma = aluno;

            for (const subjectId of Object.keys(subjects)) {
                const entry = subjects[subjectId];

                if (entry.status !== "passed") continue;
                if (entry.school_year !== selectedNendo) continue;

                const allSubjects = await apiFetch(
                    `/api/subjects?course=${aluno.course}&grade=${aluno.grade}`
                );
                const subject = allSubjects.find(s => s.id === subjectId);

                alunos.push({
                    student_id: studentId,
                    name: aluno.name,
                    attend_no: aluno.attend_no,
                    className: turma.class_name,
                    turmaLabel: `${turma.grade}年${turma.class_name}`,
                    subject_group: subject.subject_group,
                    doneDates: entry.done_dates ?? []
                });
            }
        }

        alunos.sort((a, b) => {
            if (a.turmaLabel !== b.turmaLabel)
                return a.turmaLabel.localeCompare(b.turmaLabel, "ja");
            return Number(a.attend_no) - Number(b.attend_no);
        });

        loading = false;
    }

    // 🔥 carregar nendos assim que a página abrir
    onMount(loadNendos);
</script>


<h1>再履修 — 完了済み一覧</h1>

<!-- Seleção de 年度 -->
<div style="margin-bottom: 20px;">
    <label style="font-size: 1.2em; margin-right: 10px;">年度を選択:</label>
    <select bind:value={selectedNendo} on:change={loadPassed} style="font-size: 1.2em; padding: 6px;">
        <option value="">-- 選択してください --</option>
        {#each nendos as n}
            <option value={n}>{n}</option>
        {/each}
    </select>
</div>

{#if !selectedNendo}
    <p>年度を選択してください。</p>
{:else if loading}
    <p>読み込み中...</p>
{:else if alunos.length === 0}
    <p>完了済みの再履修はありません。</p>
{:else}

    {#each Array.from(new Set(alunos.map(a => a.turmaLabel))) as turma}
        <h2 style="margin-top: 30px;">{turma}</h2>

        <ul>
            {#each alunos.filter(a => a.turmaLabel === turma) as al}
                <li style="margin-bottom: 20px;">

                    <div style="font-size: 1.2em; font-weight: bold;">
                        {al.attend_no}番 {al.name}
                        <div style="font-size: 0.9em; color: #666;">
                            {al.subject_group}
                        </div>
                    </div>

                    <table style="margin-left: 20px; margin-top: 6px; border-collapse: collapse; font-size: 0.9em;">
                        <tbody>
                            <tr>
                                <th style="padding: 4px 8px; border: 1px solid #ccc; background: #f7f7f7;">
                                    再履修日
                                </th>

                                {#each al.doneDates as d}
                                    <td style="padding: 4px 8px; border: 1px solid #ccc; text-align: center;">
                                        {d}
                                    </td>
                                {/each}
                            </tr>
                        </tbody>
                    </table>

                </li>
            {/each}
        </ul>
    {/each}

{/if}
