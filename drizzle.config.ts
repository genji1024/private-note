// Drizzle Kit configuration for private-note (plain Postgres).
// Generate migrations with: npx drizzle-kit generate
// Apply with:              npx drizzle-kit migrate (or drizzle-orm migrator)
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Fallback keeps the config parseable without env (drizzle-kit CLI only
    // connects when actually running generate/migrate/introspect).
    url:
      process.env.DATABASE_URL ??
      "postgres://app:app@localhost:5432/private_note",
  },
});
