import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = getSupabase();

          const { data, error } = await supabase
            .from("users")
            .select("id, name, email, password, role")
            .eq("email", credentials.email.toLowerCase().trim())
            .single();

          if (error || !data) {
            return null;
          }

          if (!data.password) {
            return null;
          }

          const isValid = await compare(credentials.password, data.password);

          if (!isValid) {
            return null;
          }

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
        token.role = (
          user as { id: string; name: string; email: string; role: string }
        ).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (
          session.user as {
            email: string;
            name: string;
            role?: string;
            id?: string;
          }
        ).role = token.role as string;
        (
          session.user as {
            email: string;
            name: string;
            role?: string;
            id?: string;
          }
        ).id = token.id as string;
      }
      return session;
    },
  },
};
