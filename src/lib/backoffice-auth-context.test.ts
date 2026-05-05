import assert from "node:assert/strict";
import test from "node:test";

import { resolveBackofficeAuthContext } from "./backoffice-auth-context.ts";
import { extractAuthContextFromRecord } from "./auth-token.ts";

test("uses login payload role when present without calling profile fallback", async () => {
  let profileCalls = 0;
  const context = await resolveBackofficeAuthContext(
    {
      role: "company",
      company_id: "company-1",
    },
    async () => {
      profileCalls += 1;
      return { id: "ignored", roles: [{ name: "admin" }] };
    },
    extractAuthContextFromRecord
  );

  assert.equal(context.role, "COMPANY");
  assert.equal(context.companyId, "company-1");
  assert.equal(profileCalls, 0);
});

test("falls back to /users/me payload when login payload has unknown role", async () => {
  let profileCalls = 0;
  const accessToken = "token-without-role-claim";
  const context = await resolveBackofficeAuthContext(
    {
      access_token: accessToken,
    },
    async (receivedAccessToken) => {
      profileCalls += 1;
      assert.equal(receivedAccessToken, accessToken);
      return {
        id: "user-123",
        roles: [{ name: "admin" }],
      };
    },
    extractAuthContextFromRecord
  );

  assert.equal(profileCalls, 1);
  assert.equal(context.role, "ADMIN");
  assert.equal(context.userId, "user-123");
});

test("returns unknown context when login payload lacks access token for fallback", async () => {
  let profileCalls = 0;
  const context = await resolveBackofficeAuthContext(
    {},
    async () => {
      profileCalls += 1;
      return { id: "user-123", roles: [{ name: "admin" }] };
    },
    extractAuthContextFromRecord
  );

  assert.equal(profileCalls, 0);
  assert.equal(context.role, "UNKNOWN");
});
