import { describe, it, expect } from "vitest";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  signupSchema,
  loginSchema,
  WORKSPACE_ROLES,
} from "./workspace.schema.js";

describe("WORKSPACE_ROLES", () => {
  it("is ordered low to high — tenancy.js relies on this exact order for rank comparison", () => {
    expect(WORKSPACE_ROLES).toEqual(["viewer", "editor", "admin", "owner"]);
  });
});

describe("createWorkspaceSchema", () => {
  it("accepts a minimal valid workspace", () => {
    const result = createWorkspaceSchema.parse({ name: "Acme", slug: "acme" });
    expect(result).toMatchObject({ name: "Acme", slug: "acme" });
  });

  it("rejects a slug with uppercase or spaces", () => {
    expect(() =>
      createWorkspaceSchema.parse({ name: "Acme", slug: "Acme Inc" }),
    ).toThrow();
  });

  it("rejects a negative or absurdly large budget", () => {
    expect(() =>
      createWorkspaceSchema.parse({
        name: "Acme",
        slug: "acme",
        monthlyBudgetUsd: -5,
      }),
    ).toThrow();
    expect(() =>
      createWorkspaceSchema.parse({
        name: "Acme",
        slug: "acme",
        monthlyBudgetUsd: 5_000_000,
      }),
    ).toThrow();
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(() =>
      createWorkspaceSchema.parse({ name: "A", slug: "a-co" }),
    ).toThrow();
  });
});

describe("inviteMemberSchema", () => {
  it("lowercases and trims email", () => {
    const result = inviteMemberSchema.parse({
      email: "  Person@Example.com  ",
      role: "editor",
    });
    expect(result.email).toBe("person@example.com");
  });

  it("rejects role: owner — ownership transfers separately", () => {
    expect(() =>
      inviteMemberSchema.parse({ email: "a@b.com", role: "owner" }),
    ).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      inviteMemberSchema.parse({ email: "not-an-email", role: "viewer" }),
    ).toThrow();
  });
});

describe("updateMemberRoleSchema", () => {
  it("accepts any of the four roles, including owner (transfer path uses this one)", () => {
    for (const role of WORKSPACE_ROLES) {
      expect(updateMemberRoleSchema.parse({ role })).toEqual({ role });
    }
  });
});

describe("signupSchema", () => {
  it("rejects a password under 8 characters", () => {
    expect(() =>
      signupSchema.parse({
        email: "a@b.com",
        password: "short",
        fullName: "A B",
      }),
    ).toThrow();
  });

  it("rejects a blank full name", () => {
    expect(() =>
      signupSchema.parse({
        email: "a@b.com",
        password: "longenough",
        fullName: "",
      }),
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("does not enforce a minimum password length — a wrong short password should fail auth, not validation", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.com", password: "x" }),
    ).not.toThrow();
  });

  it("rejects a missing password", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.com", password: "" }),
    ).toThrow();
  });
});
