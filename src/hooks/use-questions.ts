"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { applyCompanyOwnershipFilter } from "@/lib/ownership-guards";
import { buildRoleScopedParams } from "@/lib/role-scope";
import type { PaginatedResponse, Question, CreateQuestion } from "@/types";
import { toast } from "sonner";

type QuestionApiItem = Omit<Question, "category" | "difficulty"> & {
  category: Omit<Question["category"], "id"> & { id: string | number };
  difficulty: Omit<Question["difficulty"], "id" | "multiplier"> & {
    id: string | number;
    multiplier: string | number;
  };
};

type QuestionsApiResponse = Omit<PaginatedResponse<Question>, "items"> & {
  items?: QuestionApiItem[];
  questions?: QuestionApiItem[];
};

function normalizeQuestion(item: QuestionApiItem): Question {
  return {
    ...item,
    category: { ...item.category, id: String(item.category.id) },
    difficulty: {
      ...item.difficulty,
      id: String(item.difficulty.id),
      multiplier: Number(item.difficulty.multiplier),
    },
  };
}

function normalizeQuestionsResponse(data: QuestionsApiResponse): PaginatedResponse<Question> {
  const source = data.items ?? data.questions ?? [];
  return {
    total: data.total,
    page: data.page,
    limit: data.limit,
    total_pages: data.total_pages,
    items: source.map(normalizeQuestion),
  };
}

interface QuestionFilters {
  page?: number;
  limit?: number;
  category_id?: string;
  difficulty_id?: string;
}

export function useQuestions(filters: QuestionFilters = {}) {
  const { page = 1, limit = 10, category_id, difficulty_id } = filters;
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["questions", page, limit, category_id, difficulty_id, role, companyId],
    enabled: isEnabled,
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (category_id) params.category_id = category_id;
      if (difficulty_id) params.difficulty_id = difficulty_id;
      const scopedParams = buildRoleScopedParams(params, { role, companyId });
      const { data } = await apiClient.get<QuestionsApiResponse>("/questions", {
        params: scopedParams,
      });
      const normalized = normalizeQuestionsResponse(data);
      return {
        ...normalized,
        items: applyCompanyOwnershipFilter(normalized.items, {
          role,
          companyId,
          allowGlobalWhenCompanyMissing: true,
        }),
      };
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async (body: CreateQuestion) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const { data } = await apiClient.post("/questions", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta creada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para crear preguntas");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al crear pregunta");
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateQuestion & { id: string | number }) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const { data } = await apiClient.patch(`/questions/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta actualizada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para actualizar preguntas");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al actualizar pregunta");
    },
  });
}

export function useDeleteQuestion() {
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
      await apiClient.delete(`/questions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta eliminada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para eliminar preguntas");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al eliminar pregunta");
    },
  });
}
