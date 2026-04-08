import { auth } from "@/lib/auth";

export async function getSession() {
  return await auth();
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user as {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
}