import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from("users")
            .select("id, name, email, password, role")
            .eq("email", (credentials.email as string).toLowerCase().trim())
            .single();

          if (error || !data || !data.password) return null;

          const isValid = await compare(
            credentials.password as string,
            data.password
          );
          if (!isValid) return null;

          return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as Record<string, unknown>).role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});

export const authOptions = {};