import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config. Middleware must not import
// lib/auth.ts — that file pulls Prisma + bcryptjs, which bloated the
// Edge bundle past Vercel's 1 MB Hobby limit.
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
