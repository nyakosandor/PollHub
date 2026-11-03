/**
 * Validation shared by the forms (instant feedback) and the Server Actions
 * (the authoritative check). Results are message keys, translated by the UI.
 */
import { NewPoll, UserRole } from "@/types";
import { isClosed } from "@/lib/closingTime";

export const MIN_POLL_OPTIONS = 2;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_TEXT_LENGTH = 200;

export const USER_ROLES: UserRole[] = ["PARTICIPANT", "MANAGER"];

export type PollValidationError =
  | "titleRequired"
  | "questionRequired"
  | "optionsRequired"
  | "closingTimeRequired"
  | "closingTimeInPast"
  | "textTooLong";

export function validatePoll(
  { title, questionText, optionTexts, closesAt }: NewPoll,
  now: number
): PollValidationError | null {
  if (!title) return "titleRequired";
  if (!questionText) return "questionRequired";
  if (optionTexts.length < MIN_POLL_OPTIONS) return "optionsRequired";
  if ([title, questionText, ...optionTexts].some((text) => text.length > MAX_TEXT_LENGTH)) {
    return "textTooLong";
  }
  if (Number.isNaN(closesAt)) return "closingTimeRequired";
  if (isClosed(closesAt, now)) return "closingTimeInPast";
  return null;
}

/** Trims every text field and drops empty options. */
export function normalizeNewPoll(poll: NewPoll): NewPoll {
  return {
    title: poll.title.trim(),
    questionText: poll.questionText.trim(),
    optionTexts: poll.optionTexts.map((text) => text.trim()).filter(Boolean),
    closesAt: poll.closesAt,
  };
}

export type AuthValidationError =
  | "emailInvalid"
  | "passwordTooShort"
  | "passwordMismatch"
  | "roleInvalid";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Deliberately simple: the real check is that the address can sign in.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration({
  email,
  password,
  confirmPassword,
  role,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): AuthValidationError | null {
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_TEXT_LENGTH) return "emailInvalid";
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  if (password !== confirmPassword) return "passwordMismatch";
  if (!USER_ROLES.includes(role as UserRole)) return "roleInvalid";
  return null;
}
