"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
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
  return useQuery({
    queryKey: ["forms", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<FormsApiResponse>("/forms", {
        params: { page, limit },
      });
      return normalizeFormsResponse(data);
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFormModel) => {
      const { data } = await apiClient.post("/forms", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario creado");
    },
    onError: () => toast.error("Error al crear formulario"),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateFormModel & { id: string | number }) => {
      const { data } = await apiClient.patch(`/forms/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario actualizado");
    },
    onError: () => toast.error("Error al actualizar formulario"),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario eliminado");
    },
    onError: () => toast.error("Error al eliminar formulario"),
  });
}
