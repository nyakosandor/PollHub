import "server-only";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/validation";

// Compared against when the email is unknown, so a failed sign-in takes as
// long either way and response time does not reveal registered emails.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const authOptions: NextAuthOptions = {
  // Credentials sign-in requires stateless JWT sessions in NextAuth v4.
  session: { strategy: "jwt" },
  // Unprefixed paths are localized by the proxy, e.g. /login → /hu/login.
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(
          password,
          user?.password ?? DUMMY_PASSWORD_HASH
        );
        if (!user || !isValid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present right after sign-in.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
