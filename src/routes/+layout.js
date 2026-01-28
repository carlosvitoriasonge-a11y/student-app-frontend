import { redirect } from "@sveltejs/kit";

export function load({ url }) {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (!token && url.pathname !== "/login") {
      throw redirect(302, "/login");
    }
  }
}
