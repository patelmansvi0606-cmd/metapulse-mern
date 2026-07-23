import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Same root .env as apps/api — see the comment in apps/api/src/config.js
// for why this is resolved explicitly rather than left to dotenv's
// cwd-relative default.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required — see .env.example"),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  JOB_VISIBILITY_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  // Deliberately .optional() on both — this is the exact fix the
  // resilience upgrade made. A missing key means "that provider isn't
  // available," never "crash on startup." See packages/model-router.
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
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

if (!config.ANTHROPIC_API_KEY && !config.GOOGLE_API_KEY) {
  console.warn(
    "[worker] Starting with NO AI provider configured. This is supported — every AI-backed graph node " +
      "will run its deterministic fallback — but every content run will land in in_review rather than approved.",
  );
}
