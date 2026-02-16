// +page.js
export const ssr = false;

import { error } from '@sveltejs/kit';
import { schoolYearFromDate } from '$lib/utils/date.js';

export async function load({ params, fetch }) {
    const { course, grade, className } = params;

    // TOKEN (somente no navegador)
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

    const today = new Date().toISOString().slice(0, 10);
    const schoolYear = schoolYearFromDate(today);

    // ============================
    // 1) BUSCAR ALUNOS DA TURMA
    // ============================
    const studentsRes = await fetch(
        `/api/students/by_class?course=${course}&grade=${grade}&class_name=${encodeURIComponent(className)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!studentsRes.ok) {
        throw error(404, 'このクラスには生徒がいません。');
    }

    const students = await studentsRes.json();

    if (!students || students.length === 0) {
        throw error(404, 'このクラスには生徒がいません。');
    }

    // ============================
    // 2) NÃO CARREGA SEMANA AQUI
    //    (week_attend.svelte faz isso)
    // ============================

    return {
        course,
        grade,
        className,
        today,
        schoolYear,
        students
    };
}
