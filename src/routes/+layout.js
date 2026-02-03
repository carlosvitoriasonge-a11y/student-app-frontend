export const ssr = false;
import { redirect } from '@sveltejs/kit';

export async function load({ url, fetch }) {
  const token = localStorage.getItem('access_token');
  console.log("TOKEN:", token);

  if (!token && url.pathname !== '/login') {
    throw redirect(302, '/login');
  }

  const res = await fetch('/api/students/', {
    headers: {
      Authorization:  `Bearer ${token}`  // ← sem Bearer
    }
  });

  console.log("STATUS:", res.status);

  if (!res.ok) {
    return { allStudents: [] };
  }

  const allStudents = await res.json();
  console.log("STUDENTS:", allStudents);

  return { allStudents };
}
