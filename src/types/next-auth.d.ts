import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

// Adds the user's id and role to NextAuth's session, user and token types.
declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
