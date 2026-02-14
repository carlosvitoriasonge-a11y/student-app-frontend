export const ssr = false;

import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/api';

export async function load({ url }) {
  // 1) Se estiver na página de login, NÃO roda nada
  if (url.pathname === '/login') {
    return {};
  }

  // 2) Token obrigatório para o resto
  const token = typeof localStorage !== "undefined"
    ? localStorage.getItem("access_token")
    : null;

  if (!token) {
    throw redirect(302, '/login');
  }

  // 3) Carregar classes só quando logado
  let classList = [];

  try {
    classList = await apiFetch('/api/classes'); // ✔ sem .json()
  } catch (err) {
    console.error("Erro ao carregar classes:", err);
  }

  return { classList };
}
