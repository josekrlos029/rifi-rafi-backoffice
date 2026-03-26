import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanyQuestionPoolSelection,
  getCompanyFormModeGuardrail,
  normalizeFormQuestionFilters,
  normalizeFormModePayload,
} from "./company-form-mode.ts";

test("own-only mode uses only company-owned pool", () => {
  const selection = buildCompanyQuestionPoolSelection({
    use_only_own_questions: true,
    category_ids: ["cat-a", "cat-b"],
    difficulty_pattern: ["easy", "hard"],
  });

  assert.equal(selection.mode, "OWN_ONLY");
  assert.deepEqual(selection.sources, { company: true, admin: false });
  assert.deepEqual(selection.filters, {
    category_ids: ["cat-a", "cat-b"],
    difficulty_pattern: ["easy", "hard"],
  });
});

test("mixed mode uses company + admin pool constrained by categories and difficulty", () => {
  const selection = buildCompanyQuestionPoolSelection({
    use_only_own_questions: false,
    category_ids: ["cat-a"],
    difficulty_pattern: ["easy", "medium", "hard"],
  });

  assert.equal(selection.mode, "MIXED");
  assert.deepEqual(selection.sources, { company: true, admin: true });
  assert.deepEqual(selection.filters, {
    category_ids: ["cat-a"],
    difficulty_pattern: ["easy", "medium", "hard"],
  });
});

test("mixed mode guardrail requires at least one difficulty", () => {
  const guardrail = getCompanyFormModeGuardrail({
    use_only_own_questions: false,
    category_ids: ["cat-a"],
    difficulty_pattern: [],
  });

  assert.equal(guardrail, "MIXED_MODE_REQUIRES_DIFFICULTY_PATTERN");
});

test("filter normalization removes blanks and keeps order", () => {
  const normalized = normalizeFormQuestionFilters({
    category_ids: [" cat-a ", "", "cat-b", "   "],
    difficulty_pattern: [" easy ", "", "hard", "easy"],
  });

  assert.deepEqual(normalized.category_ids, ["cat-a", "cat-b"]);
  assert.deepEqual(normalized.difficulty_pattern, ["easy", "hard", "easy"]);
});

test("payload normalization trims ids, removes empty and dedupes categories", () => {
  const payload = normalizeFormModePayload({
    title: "Form",
    description: "Descripción válida para test",
    num_questions: 10,
    time_per_question: 20,
    use_only_own_questions: false,
    token_price: 1,
    category_ids: [" cat-a ", "", "cat-b", "cat-a"],
    difficulty_pattern: [" easy ", "", "hard", "easy"],
  });

  assert.deepEqual(payload.category_ids, ["cat-a", "cat-b"]);
  assert.deepEqual(payload.difficulty_pattern, ["easy", "hard", "easy"]);
});
