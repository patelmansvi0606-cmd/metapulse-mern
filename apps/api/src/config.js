import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// One .env at the monorepo root, which apps/worker will also read from
// starting in Phase 4 — resolved explicitly rather than relying on
// dotenv's default cwd-relative lookup, since that default breaks the
// moment this runs via `turbo run dev` (cwd = apps/api) instead of a
// plain `node src/index.js` invoked from the repo root.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required — see .env.example"),
  JWT_SECRET: z
    .string()
    .min(
      32,
      "JWT_SECRET must be at least 32 characters — generate one, do not guess one",
    ),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  COOKIE_SECURE: z.coerce.boolean().default(false), // true in production, behind HTTPS
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
export const isProduction = config.NODE_ENV === "production";
