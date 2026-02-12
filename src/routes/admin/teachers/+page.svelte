<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let teachers = [];
    let showCreateModal = false;
    let showEditModal = false;
    let showDeleteModal = false;

    let newTeacher = {
        name: "",
        subjects: [],
        homerooms: []
    };

    let editTeacher = null;
    let deleteTeacherId = null;

    onMount(async () => {
        await loadTeachers();
    });

    async function loadTeachers() {
        try {
            teachers = await apiFetch("/api/teachers/");
        } catch (err) {
            console.error("Erro ao carregar professores:", err);
        }
    }

    async function createTeacher() {
        try {
            await apiFetch("/api/teachers/", {
                method: "POST",
                body: JSON.stringify(newTeacher)
            });
            showCreateModal = false;
            newTeacher = { name: "", subjects: [], homerooms: [] };
            await loadTeachers();
        } catch (err) {
            console.error("Erro ao criar professor:", err);
        }
    }

    function openEdit(t) {
        editTeacher = structuredClone(t);
        showEditModal = true;
    }

    async function saveEdit() {
        try {
            await apiFetch(`/api/teachers/${editTeacher.id}`, {
                method: "PUT",
                body: JSON.stringify(editTeacher)
            });
            showEditModal = false;
            editTeacher = null;
            await loadTeachers();
        } catch (err) {
            console.error("Erro ao editar professor:", err);
        }
    }

    function openDelete(id) {
        deleteTeacherId = id;
        showDeleteModal = true;
    }

    async function confirmDelete() {
        try {
            await apiFetch(`/api/teachers/${deleteTeacherId}`, {
                method: "DELETE"
            });
            showDeleteModal = false;
            deleteTeacherId = null;
            await loadTeachers();
        } catch (err) {
            console.error("Erro ao deletar professor:", err);
        }
    }

    function addHomeroom(target) {
        target.homerooms = [
            ...target.homerooms,
            { grade: 1, class_name: "1組", course: "全" }
        ];
    }


    function removeHomeroom(target, index) {
        target.homerooms = target.homerooms.filter((_, i) => i !== index);
    }

</script>

<h1>教員管理</h1>

<button on:click={() => (showCreateModal = true)}>＋ 教員を追加</button>

<table class="teacher-table">
    <thead>
        <tr>
            <th>名前</th>
            <th>担当教科</th>
            <th>担任クラス</th>
            <th>操作</th>
        </tr>
    </thead>

    <tbody>
        {#each teachers as t}
            <tr>
                <td>{t.name}</td>

                <td>
                    {#each t.subjects as s, i}
                        <span>{s}</span>{#if i < t.subjects.length - 1}、{/if}
                    {/each}
                </td>
                

                <td>
                    {#each t.homerooms as hr}
                        <div>{hr.grade}年 {hr.class_name}（{hr.course}）</div>
                    {/each}
                </td>

                <td>
                    <button on:click={() => openEdit(t)}>編集</button>
                    <button on:click={() => openDelete(t.id)}>削除</button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<!-- CREATE MODAL -->
{#if showCreateModal}
<div class="modal">
    <div class="modal-content">

        <h2>教員を追加</h2>

        <!-- NOME -->
        <div class="form-group">
            <label>名前</label>
            <input
                value={newTeacher.name}
                on:input={(e) => {
                    newTeacher = { ...newTeacher, name: e.target.value };
                }}
            />
        </div>

        <!-- SUBJECTS -->
        <div class="form-group">
            <label>担当教科</label>

            {#each newTeacher.subjects as s, i}
                <div class="subject-row">
                    <input
                        value={s}
                        on:input={(e) => {
                            newTeacher.subjects = newTeacher.subjects.map((sub, idx) =>
                                idx === i ? e.target.value : sub
                            );
                            newTeacher = { ...newTeacher };
                        }}
                    />
                    <button
                        class="remove-btn"
                        on:click={() => {
                            newTeacher.subjects = newTeacher.subjects.filter((_, idx) => idx !== i);
                            newTeacher = { ...newTeacher };
                        }}
                    >
                        －
                    </button>
                </div>
            {/each}

        </div>

            <button
                class="add-btn"
                on:click={() => {
                    newTeacher.subjects = [...newTeacher.subjects, ""];
                    newTeacher = { ...newTeacher };
                }}
            >
                ＋ 教科を追加
            </button>
        

        <!-- HOMEROOMS -->
        <h3>担任クラス</h3>

        {#each newTeacher.homerooms as hr, i}
            <div class="hr-row">

                <div class="form-group small">
                    <label>学年</label>
                    <select
                        value={hr.grade}
                        on:change={(e) => {
                            newTeacher.homerooms = newTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, grade: Number(e.target.value) } : h
                            );
                            newTeacher = { ...newTeacher };
                        }}
                    >
                        <option value="1">1年</option>
                        <option value="2">2年</option>
                        <option value="3">3年</option>
                    </select>
                </div>

                <div class="form-group small">
                    <label>組</label>
                    <select
                        value={hr.class_name}
                        on:change={(e) => {
                            newTeacher.homerooms = newTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, class_name: e.target.value } : h
                            );
                            newTeacher = { ...newTeacher };
                        }}
                    >
                        <option value="1組">1組</option>
                        <option value="2組">2組</option>
                        <option value="3組">3組</option>
                    </select>
                </div>

                <div class="form-group small">
                    <label>コース</label>
                    <select
                        value={hr.course}
                        on:change={(e) => {
                            newTeacher.homerooms = newTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, course: e.target.value } : h
                            );
                            newTeacher = { ...newTeacher };
                        }}
                    >
                        <option value="全">全日</option>
                        <option value="水">水曜</option>
                        <option value="集">集中</option>
                    </select>
                </div>

                <button
                    class="remove-btn"
                    on:click={() => {
                        newTeacher.homerooms = newTeacher.homerooms.filter((_, idx) => idx !== i);
                        newTeacher = { ...newTeacher };
                    }}
                >
                    －
                </button>

            </div>
        {/each}

        <button
            class="add-btn"
            on:click={() => {
                newTeacher.homerooms = [
                    ...newTeacher.homerooms,
                    { grade: 1, class_name: "1組", course: "全" }
                ];
                newTeacher = { ...newTeacher };
            }}
        >
            ＋ 担任クラスを追加
        </button>

        <div class="modal-actions">
            <button on:click={createTeacher}>保存</button>
            <button on:click={() => (showCreateModal = false)}>キャンセル</button>
        </div>

    </div>
</div>
{/if}


<!-- EDIT MODAL -->
<!-- EDIT MODAL -->
{#if showEditModal}
<div class="modal">
    <div class="modal-content">

        <h2>教員を編集</h2>

        <!-- NOME -->
        <div class="form-group">
            <label>名前</label>
            <input
                value={editTeacher.name}
                on:input={(e) => {
                    editTeacher = { ...editTeacher, name: e.target.value };
                }}
            />
        </div>

        <!-- SUBJECTS -->
        <div class="form-group">
            <label>担当教科</label>

            {#each editTeacher.subjects as s, i}
                <div class="subject-row">
                    <input
                        value={s}
                        on:input={(e) => {
                            editTeacher.subjects = editTeacher.subjects.map((sub, idx) =>
                                idx === i ? e.target.value : sub
                            );
                            editTeacher = { ...editTeacher };
                        }}
                    />
                    <button
                        class="remove-btn"
                        on:click={() => {
                            editTeacher.subjects = editTeacher.subjects.filter((_, idx) => idx !== i);
                            editTeacher = { ...editTeacher };
                        }}
                    >
                        －
                    </button>
                </div>
            {/each}
        </div>

        <button
            class="add-btn"
            on:click={() => {
                editTeacher.subjects = [...editTeacher.subjects, ""];
                editTeacher = { ...editTeacher };
            }}
        >
            ＋ 教科を追加
        </button>

        <!-- HOMEROOMS -->
        <h3>担任クラス</h3>

        {#each editTeacher.homerooms as hr, i}
            <div class="hr-row">

                <div class="form-group small">
                    <label>学年</label>
                    <select
                        value={hr.grade}
                        on:change={(e) => {
                            editTeacher.homerooms = editTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, grade: Number(e.target.value) } : h
                            );
                            editTeacher = { ...editTeacher };
                        }}
                    >
                        <option value="1">1年</option>
                        <option value="2">2年</option>
                        <option value="3">3年</option>
                    </select>
                </div>

                <div class="form-group small">
                    <label>組</label>
                    <select
                        value={hr.class_name}
                        on:change={(e) => {
                            editTeacher.homerooms = editTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, class_name: e.target.value } : h
                            );
                            editTeacher = { ...editTeacher };
                        }}
                    >
                        <option value="1組">1組</option>
                        <option value="2組">2組</option>
                        <option value="3組">3組</option>
                    </select>
                </div>

                <div class="form-group small">
                    <label>コース</label>
                    <select
                        value={hr.course}
                        on:change={(e) => {
                            editTeacher.homerooms = editTeacher.homerooms.map((h, idx) =>
                                idx === i ? { ...h, course: e.target.value } : h
                            );
                            editTeacher = { ...editTeacher };
                        }}
                    >
                        <option value="全">全日</option>
                        <option value="水">水曜</option>
                        <option value="集">集中</option>
                    </select>
                </div>

                <button
                    class="remove-btn"
                    on:click={() => {
                        editTeacher.homerooms = editTeacher.homerooms.filter((_, idx) => idx !== i);
                        editTeacher = { ...editTeacher };
                    }}
                >
                    －
                </button>

            </div>
        {/each}

        <button
            class="add-btn"
            on:click={() => {
                editTeacher.homerooms = [
                    ...editTeacher.homerooms,
                    { grade: 1, class_name: "1組", course: "全" }
                ];
                editTeacher = { ...editTeacher };
            }}
        >
            ＋ 担任クラスを追加
        </button>

        <div class="modal-actions">
            <button on:click={saveEdit}>保存</button>
            <button on:click={() => (showEditModal = false)}>キャンセル</button>
        </div>

    </div>
</div>
{/if}





<!-- DELETE MODAL -->
{#if showDeleteModal}
<div class="modal">
    <div class="modal-content">
        <h2>削除確認</h2>
        <p>本当に削除しますか？</p>

        <div class="modal-actions">
            <button on:click={confirmDelete}>削除</button>
            <button on:click={() => (showDeleteModal = false)}>キャンセル</button>
        </div>
    </div>
</div>
{/if}

<style>
    .teacher-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    .teacher-table th,
    .teacher-table td {
        border: 1px solid #ccc;
        padding: 8px;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
    }

    .form-group.small {
        width: 100px;
    }

    .hr-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        margin-bottom: 12px;
    }

    .add-btn,
    .remove-btn {
        margin-top: 8px;
    }

    .modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal-content {
        background: white;
        padding: 20px;
        width: 420px;
        border-radius: 6px;
    }

    .modal-actions {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
    }
</style>
