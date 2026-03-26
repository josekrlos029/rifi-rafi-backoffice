import type { CreateFormModel } from "@/types";

type FormModeInput = Pick<
  CreateFormModel,
  "use_only_own_questions" | "category_ids" | "difficulty_pattern"
>;

export type CompanyFormQuestionMode = "OWN_ONLY" | "MIXED";
export type CompanyFormModeGuardrail =
  | "MIXED_MODE_REQUIRES_CATEGORY"
  | "MIXED_MODE_REQUIRES_DIFFICULTY_PATTERN";

export interface CompanyQuestionPoolSelection {
  mode: CompanyFormQuestionMode;
  sources: {
    company: true;
    admin: boolean;
  };
  filters: {
    category_ids: string[];
    difficulty_pattern: string[];
  };
}

function normalizeStringList(values: string[] | undefined, allowDuplicates: boolean): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) continue;
    if (!allowDuplicates && seen.has(trimmed)) continue;
    normalized.push(trimmed);
    seen.add(trimmed);
  }

  return normalized;
}

export function normalizeFormQuestionFilters(input: Pick<FormModeInput, "category_ids" | "difficulty_pattern">) {
  return {
    category_ids: normalizeStringList(input.category_ids, false),
    difficulty_pattern: normalizeStringList(input.difficulty_pattern, true),
  };
}

export function buildCompanyQuestionPoolSelection(input: FormModeInput): CompanyQuestionPoolSelection {
  const filters = normalizeFormQuestionFilters(input);
  const mode: CompanyFormQuestionMode = input.use_only_own_questions ? "OWN_ONLY" : "MIXED";

  return {
    mode,
    sources: {
      company: true,
      admin: mode === "MIXED",
    },
    filters,
  };
}

export function getCompanyFormModeGuardrail(input: FormModeInput): CompanyFormModeGuardrail | null {
  const selection = buildCompanyQuestionPoolSelection(input);
  if (selection.mode !== "MIXED") return null;
  if (selection.filters.category_ids.length === 0) return "MIXED_MODE_REQUIRES_CATEGORY";
  if (selection.filters.difficulty_pattern.length === 0) {
    return "MIXED_MODE_REQUIRES_DIFFICULTY_PATTERN";
  }
  return null;
}

export function normalizeFormModePayload(body: CreateFormModel): CreateFormModel {
  const filters = normalizeFormQuestionFilters(body);
  return {
    ...body,
    use_only_own_questions: Boolean(body.use_only_own_questions),
    category_ids: filters.category_ids,
    difficulty_pattern: filters.difficulty_pattern,
  };
}
