import { auth } from "@/lib/auth";

export async function getSessionUser() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    return session.user as {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  } catch {
    return null;
  }
}