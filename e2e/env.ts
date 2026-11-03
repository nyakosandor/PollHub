/** Settings shared by the Playwright config and the tests. */
export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

/** The tests use their own database, so they never touch dev.db. */
export const E2E_DATABASE_FILE = "e2e.db";
export const E2E_DATABASE_URL = `file:./${E2E_DATABASE_FILE}`;
