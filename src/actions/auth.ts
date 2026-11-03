"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isUniqueConstraintError } from "@/lib/dbErrors";
import { PASSWORD_HASH_ROUNDS } from "@/lib/password";
import {
  AuthValidationError,
  normalizeEmail,
  validateRegistration,
} from "@/lib/validation";
import { UserRole } from "@/types";

export type RegisterError = AuthValidationError | "emailTaken";

export type RegisterResult = { ok: true } | { ok: false; error: RegisterError };

/**
 * Creates an account. The client signs in with the same credentials
 * afterwards, through NextAuth.
 */
export async function register(input: {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const error = validateRegistration({ ...input, email });
  if (error) return { ok: false, error };

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, error: "emailTaken" };

  try {
    await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS),
        role: input.role as UserRole,
      },
    });
  } catch (cause) {
    // Two sign-ups with the same email at once: the unique index decides.
    if (isUniqueConstraintError(cause)) return { ok: false, error: "emailTaken" };
    throw cause;
  }
  return { ok: true };
}
