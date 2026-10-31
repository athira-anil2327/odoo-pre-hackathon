import { redirect } from "@sveltejs/kit";

export const prerender = false;
export const ssr = true;

export function load() {
  throw redirect(302, "/quotations");
}
