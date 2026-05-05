import type { AuthContext } from "./auth-token";

type ExtractAuthContextFromRecord = (record: Record<string, unknown>) => AuthContext;

export async function resolveBackofficeAuthContext(
  loginPayload: Record<string, unknown>,
  fetchCurrentUser: (accessToken: string) => Promise<Record<string, unknown>>,
  extractAuthContextFromRecord: ExtractAuthContextFromRecord
): Promise<AuthContext> {
  const payloadContext = extractAuthContextFromRecord(loginPayload);
  if (payloadContext.role !== "UNKNOWN") {
    return payloadContext;
  }

  const accessToken = loginPayload.access_token;
  if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return payloadContext;
  }

  const currentUser = await fetchCurrentUser(accessToken);
  return extractAuthContextFromRecord(currentUser);
}
