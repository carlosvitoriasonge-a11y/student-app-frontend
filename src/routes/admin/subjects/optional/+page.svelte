<script>
    import { onMount } from "svelte";
    import Modal from "$lib/Modal.svelte";
    import { apiFetch } from "$lib/api.js";

    let subjects = [];
    let showModal = false;
    let selectedSubject = null;
    let showCreateModal = false;
    let showEditModal = false;
    let editForm = null;
    let teachers = [];


    onMount(async () => {
        subjects = await apiFetch("/api/subjects/optional");
        teachers = await apiFetch("/api/teachers");
    });

    $: years = [1, 2, 3];


    $: if (teachers.length > 0 && subjects.length > 0) {
    subjects = [...subjects];
    }

    const UNIVERSAL_SUBJECTS = ["探究"];

    $: availableTeachers = teachers.filter(t => {
    const target = showEditModal ? editForm?.name : form?.name;

    // Se não tem nome ainda → mostra todos
    if (!target) return true;

    // Se é matéria universal → mostra todos
    if (UNIVERSAL_SUBJECTS.includes(target)) return true;

    // Caso contrário → filtra por subjects
    return t.subjects?.includes(target);
    });

    function getTeacherNames(ids) {
    if (!ids || ids.length === 0) return "—";

    // Converte tudo para string
    const stringIds = ids.map(id => String(id));

    return teachers
        .filter(t => stringIds.includes(String(t.id)))
        .map(t => t.name)
        .join("、");
    
    }

    function displayTeacherNames(ids) {
    if (!ids || ids.length === 0) return "—";

    // Caso especial: 各担任
    if (ids.length === 1 && ids[0] === "ALL_HOMEROOM") {
        return "各担任";
    }

    // Converte IDs para número
    const numericIds = ids.map(id => Number(id));

    return teachers
        .filter(t => numericIds.includes(t.id))
        .map(t => t.name)
        .join("、");
    }






    async function openSubject(id) {
        selectedSubject = await apiFetch(`/api/subjects/${id}`);
        showModal = true;
    }

    async function deleteSubject(id) {
        if (!confirm("本当に削除しますか？")) return;

        await apiFetch(`/api/subjects/${id}`, { method: "DELETE" });

        subjects = subjects.filter(s => s.id !== id);
        showModal = false;
    }


    async function createSubject() {
        try {
            const newSubject = await apiFetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

                    // pega o subject completo
            const full = await apiFetch(`/api/subjects/${newSubject.id}`);

            subjects = [...subjects, newSubject];
            showCreateModal = false;

            form = {
                name: "",
                subject_group: "",
                code: "",
                credits: 0,
                required_attendance: 0,
                required_reports: 0,
                type: "optional",
                grade: 1,
                course: "全",
                teacher_ids: []
            };

        } catch (err) {
            alert("エラー: " + err.message);
        }
    }


    // limpa o formulário
    let form = {
        name: "",
        subject_group: "",
        code: "",
        credits: 0,
        required_attendance: 0,
        required_reports: 0,
        type: "optional",
        grade: 1,
        course: "",
        teacher_ids: []
    };


    function startEdit(subject) {
        editForm = structuredClone(subject);
        if (!editForm.grade) editForm.grade = 1;
        showEditModal = true;
       

    }

    async function updateSubject() {
    try {
        const updated = await apiFetch(`/api/subjects/${editForm.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
        });

        const full = await apiFetch(`/api/subjects/${editForm.id}`);

        // Atualiza a lista local
        subjects = subjects.map(s => s.id === updated.id ? updated : s);

        showEditModal = false;

    } catch (err) {
        alert("エラー: " + err.message);
    }
}

const COURSE_ORDER = ["全", "水", "集"];

function sortSubjects(list) {
    return [...list].sort((a, b) => {
        // 1. Ordenar pelo grupo principal (国語、公民…)
        const aMain = SUBJECT_ORDER.indexOf(a.name);
        const bMain = SUBJECT_ORDER.indexOf(b.name);

        if (aMain !== bMain) return aMain - bMain;

        // 2. Dentro do grupo, ordenar pelo subject_group
        if (a.subject_group !== b.subject_group) {
            return a.subject_group.localeCompare(b.subject_group, "ja");
        }

        // 3. Dentro do subject_group, ordenar pelo course
        const aCourse = COURSE_ORDER.indexOf(a.course);
        const bCourse = COURSE_ORDER.indexOf(b.course);

        return aCourse - bCourse;
    });
}





</script>

<h1>探究科目一覧</h1>

<button on:click={() => showCreateModal = true}>
    新規科目追加
</button>

{#if subjects.length === 0}
    <p>まだ科目がありません。</p>
{/if}



{#each years as year}
    <h2>{year}年生の科目</h2>

    {#if subjects.filter(s => s.grade === year).length === 0}
        <p>まだ科目がありません。</p>
    {:else}
        <table>
            <thead>
                <tr>
            
                    <th>教科</th>
                    <th>科目</th>
                    <th>コース</th>
                    <th>担当教員</th>
                </tr>
            </thead>

            <tbody>
                {#each subjects.filter(s => s.grade === year) as s}
                    <tr>
                        <td on:click={() => openSubject(s.id)} style="cursor:pointer;">{s.name}</td>
                        <td on:click={() => openSubject(s.id)} style="cursor:pointer;">{s.subject_group ?? "—"}</td>
                        <td on:click={() => openSubject(s.id)} style="cursor:pointer;">{s.course}</td>
                        <td on:click={() => openSubject(s.id)} style="cursor:pointer;">{displayTeacherNames(s.teacher_ids)}

                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}

    <br/>
{/each}

<Modal open={showModal} close={() => showModal = false}>
    {#if selectedSubject}
        <h2>{selectedSubject.name}</h2>

        <p><strong>教科:</strong> {selectedSubject.subject_group ?? "—"}</p>
        <p><strong>種別:</strong> 探究科目</p>
        <p><strong>担当教員:</strong>　{displayTeacherNames(selectedSubject.teacher_ids)}</p>

        <button on:click={() => startEdit(selectedSubject)}>編集</button>



        <button style="margin-left: 10px;" on:click={() => deleteSubject(selectedSubject.id)}>
            削除
        </button>
    {/if}
</Modal>


<Modal open={showCreateModal} close={() => showCreateModal = false}>
    <h2>新規科目追加</h2>

    <form class="edit-form" on:submit|preventDefault={createSubject}>
        <label>教科</label>
        <input bind:value={form.name} required />

        <label>科目</label>
        <input bind:value={form.subject_group} />

        <label>学年</label>
        <select bind:value={form.grade}>
            <option value="1">1年</option>
            <option value="2">2年</option>
            <option value="3">3年</option>
        </select>


        <label>担当教員</label>
        <select bind:value={form.teacher_ids} multiple>
            {#if form.name === "探究"}
                <option value="ALL_HOMEROOM">各担任</option>
            {/if}
        
            {#each availableTeachers as t}
                <option value={t.id}>{t.name}</option>
            {/each}
        </select>
        
    

        <button type="submit">追加</button>
    </form>
</Modal>

<Modal open={showEditModal} close={() => showEditModal = false}>
    {#if editForm}
        <h2>科目編集</h2>

        <form class="edit-form" on:submit|preventDefault={updateSubject}>
            <label>教科</label>
            <input bind:value={editForm.name} required />

            <label>科目</label>
            <input bind:value={editForm.subject_group} />

            <label>学年</label>
                <select bind:value={editForm.grade}>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
            </select>


            <label>担当教員</label>
            <select bind:value={editForm.teacher_ids} multiple>

            {#if editForm.name === "探究"}
                <option value="ALL_HOMEROOM">各担任</option>
            {/if}
        
            {#each availableTeachers as t}
                <option value={t.id}>{t.name}</option>
            {/each}
        </select>
            


            <button type="submit">保存</button>
        </form>
    {/if}
</Modal>


<style>
     .edit-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    .edit-form input,
    .edit-form select {
        padding: 8px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .edit-form button {
        margin-top: 10px;
        padding: 10px;
        font-size: 1rem;
    }

    table {
        width: 40%;
        border-collapse: collapse;
        background: white;
        table-layout: fixed; /* ← garante alinhamento uniforme */
    }

    thead {
        background: #f5f5f5;
    }

    th, td {
        padding: 6px 10px; /* ← espaçamento menor e mais elegante */
        border-bottom: 1px solid #ddd;
        text-align: left;
        white-space: nowrap; /* ← impede quebra feia */
        overflow: hidden;
        text-overflow: ellipsis; /* ← corta nomes longos com "..." */
    }

    tr:hover {
        background: #fafafa;
    }

    h2 {
        margin-top: 24px;
        margin-bottom: 8px;
        font-size: 1.1rem;
        border-left: 4px solid #0078d4;
        padding-left: 8px;
    }

    button {
        padding: 4px 10px;
        font-size: 0.85rem;
        border: none;
        background: #0078d4;
        color: white;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background: #005fa3;
    }

    td:first-child,
    th:first-child {
    width:10%; /* ajuste como quiser */
    }

    th:nth-child(3), td:nth-child(3) {
    width: 10%;
    }

    th:nth-child(2), td:nth-child(2) {
    width: 20%;
    }

    th:nth-child(4), td:nth-child(4) {
    width: 15%;
    }





</style>

