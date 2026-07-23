import { z } from "zod";

/**
 * Four-role model, ordered low -> high. Index in this array IS the
 * privilege rank — tenancy.js compares indexes rather than hardcoding
 * a second copy of the ordering, so this array is the one place that
 * ordering is allowed to live.
 */
export const WORKSPACE_ROLES = ["viewer", "editor", "admin", "owner"];

export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  monthlyBudgetUsd: z.number().positive().max(1_000_000).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: workspaceRoleSchema.refine((role) => role !== "owner", {
    message: "Ownership transfers separately — invite as admin/editor/viewer",
  }),
});

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
