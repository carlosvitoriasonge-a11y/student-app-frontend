export const ssr = false;

import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/api';

export async function load({ url }) {
  const token = typeof localStorage !== "undefined"
    ? localStorage.getItem("access_token")
    : null;

  if (!token && url.pathname !== '/login') {
    throw redirect(302, '/login');
  }

  let classList = [];

  try {
    classList = await apiFetch('/api/classes'); // ✔ sem .json()
  } catch (err) {
    console.error("Erro ao carregar classes:", err);
  }

  return { classList };
}
