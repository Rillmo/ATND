import { getAuthSession } from "@/auth";

export async function getSessionUser() {
  const session = await getAuthSession();
  return session?.user ?? null;
}
