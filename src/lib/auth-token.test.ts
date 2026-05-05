import assert from "node:assert/strict";
import test from "node:test";

import { extractAuthContextFromRecord } from "./auth-token.ts";

test("extracts ADMIN role from roles object array", () => {
  const context = extractAuthContextFromRecord({
    id: "user-1",
    roles: [{ id: "r-1", name: "admin" }],
  });

  assert.equal(context.role, "ADMIN");
  assert.equal(context.userId, "user-1");
});

test("extracts COMPANY role and nested company id from user payload", () => {
  const context = extractAuthContextFromRecord({
    user: {
      id: "user-2",
      roles: [{ id: "r-2", name: "company" }],
      company: { id: "company-9" },
    },
  });

  assert.equal(context.role, "COMPANY");
  assert.equal(context.userId, "user-2");
  assert.equal(context.companyId, "company-9");
});

test("prioritizes ADMIN when roles include both USER and ADMIN", () => {
  const context = extractAuthContextFromRecord({
    id: "user-3",
    roles: [
      { id: "r-dev", name: "developer" },
      { id: "r-user", name: "user" },
      { id: "r-admin", name: "admin" },
    ],
  });

  assert.equal(context.role, "ADMIN");
  assert.equal(context.userId, "user-3");
});
