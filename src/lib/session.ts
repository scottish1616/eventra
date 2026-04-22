import { auth } from "@/lib/auth";

export async function getSessionUser() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    const user = session.user as {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
    return user;
  } catch (error) {
    console.error("[getSessionUser]", error);
    return null;
  }
}