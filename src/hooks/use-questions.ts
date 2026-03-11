"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, Question, CreateQuestion } from "@/types";
import { toast } from "sonner";

interface QuestionFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  difficulty_id?: number;
}

export function useQuestions(filters: QuestionFilters = {}) {
  const { page = 1, limit = 10, category_id, difficulty_id } = filters;
  return useQuery({
    queryKey: ["questions", page, limit, category_id, difficulty_id],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (category_id) params.category_id = category_id;
      if (difficulty_id) params.difficulty_id = difficulty_id;
      const { data } = await apiClient.get<PaginatedResponse<Question>>("/questions", { params });
      return data;
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateQuestion) => {
      const { data } = await apiClient.post("/questions", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta creada");
    },
    onError: () => toast.error("Error al crear pregunta"),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateQuestion & { id: number }) => {
      const { data } = await apiClient.patch(`/questions/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta actualizada");
    },
    onError: () => toast.error("Error al actualizar pregunta"),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/questions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Pregunta eliminada");
    },
    onError: () => toast.error("Error al eliminar pregunta"),
  });
}
