# rifi_rafi_backoffice

Backoffice web app (Next.js) for Rifi Rafi management.

## Development

```bash
npm install
npm run dev
```

## Role-based visibility (ADMIN vs COMPANY)

This app now applies best-effort client and middleware RBAC visibility:

- JWT parsing extracts `role` and `company_id` (supports common claim aliases).
- `ADMIN` gets full navigation and global CRUD visibility.
- `COMPANY` gets:
  - no Categories/Difficulties pages in navigation
  - blocked direct access to `/categories` and `/difficulties` via middleware redirect
  - scoped list requests for forms/questions/gym-configs (adds `scope=own` and `company_id` params)
  - client-side filtering fallback to own-company items when payload includes ownership fields
- Unknown/non-backoffice roles are rejected at login, middleware, and client guard.

### Assumptions and limitations (important)

- **Backend enforcement is still required** for real security.
- Frontend/middleware checks can be bypassed by crafted requests if backend does not validate role/ownership.
- Company ownership fallback filtering depends on ownership fields being present in API payloads (e.g. `company_id`, nested company objects). If missing, fallback behavior may be permissive or restrictive depending on resource type.
- Route-level middleware currently keeps `middleware.ts` for compatibility in this repo, though Next.js 16 warns about `proxy.ts` migration.

## Company form mode (COMPANY)

Forms support two explicit company modes:

- `use_only_own_questions = true` → select only company-owned questions.
- `use_only_own_questions = false` → mixed pool (company + ADMIN reusable pool), always filtered by `category_ids` and `difficulty_pattern`.

Client guardrails implemented:

- create/edit form UX shows explicit mode selection and a mode summary;
- payload normalization trims/removes invalid ids before submit (`category_ids`, `difficulty_pattern`);
- mixed mode blocks submit unless at least one category and one difficulty are present;
- UI shows user-facing note describing required backend behavior.

Expected backend behavior:

1. enforce company ownership when `use_only_own_questions = true`;
2. in mixed mode, include only `{company_id = auth.company_id} + ADMIN` question sources;
3. always apply form `category_ids` and `difficulty_pattern` filters before selecting questions;
4. reject invalid/insufficient pool conditions with explicit validation errors.

## Sensitive data and access policy

Backoffice views are intended only for management contexts (`ADMIN` / `COMPANY`), never final `USER`.

### Client-side guardrails implemented

- Middleware checks the `rifi-auth-token` cookie and blocks:
  - missing token
  - expired token
  - non-backoffice roles
- Admin route layout uses `BackofficeGuard` to block unauthorized role state after hydration.
- Login flow denies backoffice access for `USER` / `UNKNOWN` role contexts.
- Refresh-token flow also validates the refreshed role before continuing.

### Important limitation

These are UX/security guardrails only. **True enforcement must be backend RBAC**:

1. Management endpoints (`/questions`, `/forms`, `/gym/configs`, etc.) must return `403` for USER.
2. Company-scoped resources must enforce ownership on server side.
3. Sensitive question correctness/scoring fields must only be returned to authorized admin/company contexts.
