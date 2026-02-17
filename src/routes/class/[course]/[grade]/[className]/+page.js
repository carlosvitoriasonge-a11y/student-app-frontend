import { schoolYearFromDate } from '$lib/utils/date.js';
export const ssr = false;

import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
    const course = params.course;
    const grade = params.grade;
    const className = params.className;

    const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

    // Buscar todos os alunos
    const res = await fetch(`/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const allStudents = await res.json();

    // Filtrar só os alunos dessa turma
    const students = allStudents.filter((s) => {
        if (!s.class_name || s.class_name === '') return false;

        return (
            s.course === course &&
            String(s.grade) === String(grade) &&
            s.class_name === className
        );
    });

    if (students.length === 0) {
        throw error(404, 'このクラスには生徒がいません');
    }

    // Calcular ano letivo
    const today = new Date().toISOString().slice(0, 10);
    const schoolYear = schoolYearFromDate(today);

    // 🔥 PASSO 3: BUSCAR ESTATÍSTICAS POR ALUNO
    const statsRes = await fetch(
      `/api/attendance_stats/stats?course=${course}&grade=${grade}&class_name=${className}&school_year=${schoolYear}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    const statsJson = await statsRes.json();

    console.log('statsJson >>>', statsJson);

    
    return {
        course,
        grade,
        className,
        students,
        schoolYear,

        // 🔥 ESTATÍSTICA DA TURMA
        classStats: statsJson.stats,

        // 🔥 ESTATÍSTICA POR ALUNO
        studentStats: statsJson.student_stats,
        dailyAttendance: statsJson.dailyAttendance
    };
}

