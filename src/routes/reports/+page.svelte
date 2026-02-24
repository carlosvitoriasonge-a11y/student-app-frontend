<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import Modal from "$lib/Modal.svelte";

    export let params;

    let student = null;
    let reports = {};
    let subjects = [];

    let selectedYear = "";
    let selectedSubject = "";
    let showCreateModal = false;
    let showEditModal = false;

    let newReport = {
        id: "",
        date: "",
        status: "submitted",
        comment: ""
    };

    let editReport = null;

    onMount(async () => {
        student = await apiFetch(`/api/students/${params.student_id}`);
        reports = await apiFetch(`/api/reports/${params.student_id}`);
        subjects = await apiFetch(`/api/subjects/required`);
    });

    function getSubjectName(id) {
        const s = subjects.find(x => x.id === id);
        return s ? `${s.name} ${s.subject_group ?? ""}` : "不明科目";
    }

    async function createReport() {
        const res = await apiFetch(
            `/api/reports/${params.student_id}/${selectedYear}/${selectedSubject}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReport)
            }
        );

        reports = await apiFetch(`/api/reports/${params.student_id}`);
        showCreateModal = false;

        newReport = {
            id: "",
            date: "",
            status: "submitted",
            comment: ""
        };
    }

    function startEdit(item, year, subject) {
        editReport = structuredClone(item);
        selectedYear = year;
        selectedSubject = subject;
        showEditModal = true;
    }

    async function saveEdit() {
        await apiFetch(
            `/api/reports/${params.student_id}/${selectedYear}/${selectedSubject}/${editReport.id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editReport)
            }
        );

        reports = await apiFetch(`/api/reports/${params.student_id}`);
        showEditModal = false;
    }

    async function deleteReport(item, year, subject) {
        if (!confirm("削除しますか？")) return;

        await apiFetch(
            `/api/reports/${params.student_id}/${year}/${subject}/${item.id}`,
            { method: "DELETE" }
        );

        reports = await apiFetch(`/api/reports/${params.student_id}`);
    }
</script>

<h1>レポート管理 — {student?.name}</h1>

<h2>年度選択</h2>

<select bind:value={selectedYear}>
    <option value="">選択してください</option>
    {#each Object.keys(reports) as year}
        <option value={year}>{year}</option>
    {/each}
</select>

{#if selectedYear}
    <h2>科目選択</h2>

    <select bind:value={selectedSubject}>
        <option value="">選択してください</option>

        {#each Object.keys(reports[selectedYear]?.subjects ?? {}) as sid}
            <option value={sid}>{getSubjectName(sid)}</option>
        {/each}
    </select>
{/if}

{#if selectedYear && selectedSubject}
    <h2>レポート一覧</h2>

    <button on:click={() => showCreateModal = true}>新規レポート追加</button>

    <table>
        <thead>
            <tr>
                <th>日付</th>
                <th>状態</th>
                <th>コメント</th>
                <th></th>
            </tr>
        </thead>

        <tbody>
            {#each reports[selectedYear].subjects[selectedSubject].items as item}
                <tr>
                    <td>{item.date}</td>
                    <td>{item.status}</td>
                    <td>{item.comment}</td>
                    <td>
                        <button on:click={() => startEdit(item, selectedYear, selectedSubject)}>編集</button>
                        <button on:click={() => deleteReport(item, selectedYear, selectedSubject)}>削除</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<!-- CREATE MODAL -->
<Modal open={showCreateModal} close={() => showCreateModal = false}>
    <h2>新規レポート追加</h2>

    <label>日付</label>
    <input type="date" bind:value={newReport.date} />

    <label>状態</label>
    <select bind:value={newReport.status}>
        <option value="submitted">提出済</option>
        <option value="accepted">合格</option>
        <option value="rejected">再提出</option>
        <option value="pending">未処理</option>
    </select>

    <label>コメント</label>
    <input bind:value={newReport.comment} />

    <button on:click={createReport}>追加</button>
</Modal>

<!-- EDIT MODAL -->
<Modal open={showEditModal} close={() => showEditModal = false}>
    <h2>レポート編集</h2>

    <label>日付</label>
    <input type="date" bind:value={editReport.date} />

    <label>状態</label>
    <select bind:value={editReport.status}>
        <option value="submitted">提出済</option>
        <option value="accepted">合格</option>
        <option value="rejected">再提出</option>
        <option value="pending">未処理</option>
    </select>

    <label>コメント</label>
    <input bind:value={editReport.comment} />

    <button on:click={saveEdit}>保存</button>
</Modal>
