"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { applyCompanyOwnershipFilter } from "@/lib/ownership-guards";
import { buildRoleScopedParams } from "@/lib/role-scope";
import {
  getCompanyFormModeGuardrail,
  normalizeFormModePayload,
  type CompanyFormModeGuardrail,
} from "@/lib/company-form-mode";
import type {
  PaginatedResponse,
  FormModel,
  CreateFormModel,
  QuestionCategory,
  QuestionDifficulty,
} from "@/types";
import { toast } from "sonner";

type CategoryApiItem = Omit<QuestionCategory, "id"> & { id: string | number };
type DifficultyApiItem = Omit<QuestionDifficulty, "id" | "multiplier"> & {
  id: string | number;
  multiplier: string | number;
};
type FormApiItem = Omit<FormModel, "categories" | "difficulty_pattern"> & {
  categories?: CategoryApiItem[];
  difficulty_pattern?: DifficultyApiItem[];
};

type FormsApiResponse = Omit<PaginatedResponse<FormModel>, "items"> & {
  items?: FormApiItem[];
  forms?: FormApiItem[];
  form_models?: FormApiItem[];
};

const FORM_MODE_GUARDRAIL_MESSAGES: Record<CompanyFormModeGuardrail, string> = {
  MIXED_MODE_REQUIRES_CATEGORY:
    "En modo mixto debes seleccionar al menos una categoría para acotar el pool.",
  MIXED_MODE_REQUIRES_DIFFICULTY_PATTERN:
    "En modo mixto debes definir al menos una dificultad en el patrón.",
};

function isFormModeGuardrailMessage(value: string): value is CompanyFormModeGuardrail {
  return value in FORM_MODE_GUARDRAIL_MESSAGES;
}

function normalizeAndValidateFormPayload(role: string, body: CreateFormModel): CreateFormModel {
  const normalized = normalizeFormModePayload(body);
  if (role === "COMPANY") {
    const guardrail = getCompanyFormModeGuardrail(normalized);
    if (guardrail) {
      throw new Error(guardrail);
    }
  }
  return normalized;
}

function handleFormMutationError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
    toast.error("No tienes permisos para operar formularios");
    return;
  }
  if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
    toast.error("No se detectó company_id en tu sesión");
    return;
  }
  if (error instanceof Error && isFormModeGuardrailMessage(error.message)) {
    toast.error(FORM_MODE_GUARDRAIL_MESSAGES[error.message]);
    return;
  }
  toast.error(fallbackMessage);
}

function normalizeForm(item: FormApiItem): FormModel {
  return {
    ...item,
    categories: (item.categories ?? []).map((category) => ({
      ...category,
      id: String(category.id),
    })),
    difficulty_pattern: (item.difficulty_pattern ?? []).map((difficulty) => ({
      ...difficulty,
      id: String(difficulty.id),
      multiplier: Number(difficulty.multiplier),
    })),
  };
}

function normalizeFormsResponse(data: FormsApiResponse): PaginatedResponse<FormModel> {
  const source = data.items ?? data.forms ?? data.form_models ?? [];
  return {
    total: data.total,
    page: data.page,
    limit: data.limit,
    total_pages: data.total_pages,
    items: source.map(normalizeForm),
  };
}

export function useForms(page = 1, limit = 10) {
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["forms", page, limit, role, companyId],
    enabled: isEnabled,
    queryFn: async () => {
      const params = buildRoleScopedParams({ page, limit }, { role, companyId });
      const { data } = await apiClient.get<FormsApiResponse>("/forms", {
        params,
      });
      const normalized = normalizeFormsResponse(data);
      return {
        ...normalized,
        items: applyCompanyOwnershipFilter(normalized.items, {
          role,
          companyId,
          allowGlobalWhenCompanyMissing: false,
        }),
      };
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async (body: CreateFormModel) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const payload = normalizeAndValidateFormPayload(role, body);
      const { data } = await apiClient.post("/forms", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario creado");
    },
    onError: (error) => handleFormMutationError(error, "Error al crear formulario"),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateFormModel & { id: string | number }) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const payload = normalizeAndValidateFormPayload(role, body);
      const { data } = await apiClient.patch(`/forms/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario actualizado");
    },
    onError: (error) => handleFormMutationError(error, "Error al actualizar formulario"),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async (id: string | number) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      await apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario eliminado");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para eliminar formularios");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al eliminar formulario");
    },
  });
}
