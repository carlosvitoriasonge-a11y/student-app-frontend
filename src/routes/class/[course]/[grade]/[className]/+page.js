export const ssr = false;

import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
    const course = params.course;       // 全, 水, 集
    const grade = params.grade;         // "1", "2", "3"
    const className = params.className; // "1組", "2組", ...
  
    const token = localStorage.getItem('access_token');
  
    // 1. Buscar todos os alunos (AGORA COM TOKEN)
    const res = await fetch('/api/students/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  
    const allStudents = await res.json();
  
    // 2. Filtrar só os alunos dessa turma
    const students = allStudents.filter((s) => {
      if (!s.class_name || s.class_name === '') return false;
  
      return (
        s.course === course &&
        String(s.grade) === String(grade) &&
        s.class_name === className
      );
    });
  
    const classExists = students.length > 0;
  
    if (!classExists) {
        throw error(404, 'このクラスは存在しません');

    }
  
    return {
      course,
      grade,
      className,
      students
    };
  }
  