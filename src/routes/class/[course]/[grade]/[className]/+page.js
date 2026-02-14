import { schoolYearFromDate } from '$lib/utils/date.js';
export const ssr = false;

import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
    const course = params.course;
    const grade = params.grade;
    const className = params.className;

    // ============================================
    // 1) TOKEN (somente no navegador)
    // ============================================
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

    // ============================================
    // 2) DATA CORRETA (RECALCULADA SEMPRE)
    // ============================================
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // ============================================
    // 3) ANO LETIVO
    // ============================================
    const schoolYear = schoolYearFromDate(today);

    // ============================================
    // 4) BUSCAR ALUNOS DA TURMA (SEM /api/students/)
    // ============================================
    const studentsRes = await fetch(
        `/api/students/by_class?course=${course}&grade=${grade}&class_name=${encodeURIComponent(className)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!studentsRes.ok) {
        throw error(404, 'このクラスには生徒がいません');
    }

    const students = await studentsRes.json();

    if (!students || students.length === 0) {
        throw error(404, 'このクラスには生徒がいません');
    }

    // ============================================
    // 5) BUSCAR ESTATÍSTICAS DE PRESENÇA
    // ============================================
    const statsRes = await fetch(
        `/api/attendance/stats?course=${course}&grade=${grade}&class_name=${encodeURIComponent(className)}&school_year=${schoolYear}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const statsJson = await statsRes.json();
    console.log("statsJson >>>", statsJson);

    return {
        course,
        grade,
        className,
        today,          // ← AQUI! A DATA CORRETA VAI PARA O SVELTE
        schoolYear,
        students,
        classStats: statsJson.stats,
        studentStats: statsJson.student_stats,
        dailyAttendance: statsJson.dailyAttendance
    };
}
