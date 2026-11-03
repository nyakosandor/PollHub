/** Prisma's error for a violated unique constraint (e.g. a second vote or a taken email). */
export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
