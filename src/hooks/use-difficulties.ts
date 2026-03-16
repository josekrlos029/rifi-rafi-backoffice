"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, QuestionDifficulty, CreateDifficulty } from "@/types";
import { toast } from "sonner";

type DifficultyApiItem = Omit<QuestionDifficulty, "id" | "multiplier"> & {
  id: string | number;
  multiplier: string | number;
};

type DifficultiesApiResponse = Omit<PaginatedResponse<QuestionDifficulty>, "items"> & {
  items?: DifficultyApiItem[];
  difficulties?: DifficultyApiItem[];
};

function normalizeDifficulty(item: DifficultyApiItem): QuestionDifficulty {
  return {
    ...item,
    id: String(item.id),
    multiplier: Number(item.multiplier),
  };
}

function normalizeDifficultiesResponse(
  data: DifficultiesApiResponse
): PaginatedResponse<QuestionDifficulty> {
  const source = data.items ?? data.difficulties ?? [];
  return {
    total: data.total,
    page: data.page,
    limit: data.limit,
    total_pages: data.total_pages,
    items: source.map(normalizeDifficulty),
  };
}

export function useDifficulties(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["difficulties", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<DifficultiesApiResponse>(
        "/questions/difficulties",
        { params: { page, limit } }
      );
      return normalizeDifficultiesResponse(data);
    },
  });
}

export function useAllDifficulties() {
  return useQuery({
    queryKey: ["difficulties", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<DifficultiesApiResponse>(
        "/questions/difficulties",
        { params: { limit: 100 } }
      );
      return normalizeDifficultiesResponse(data).items;
    },
  });
}

export function useCreateDifficulty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateDifficulty) => {
      const { data } = await apiClient.post("/questions/difficulties", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad creada");
    },
    onError: () => toast.error("Error al crear dificultad"),
  });
}

export function useUpdateDifficulty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateDifficulty & { id: string }) => {
      const { data } = await apiClient.patch(`/questions/difficulties/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad actualizada");
    },
    onError: () => toast.error("Error al actualizar dificultad"),
  });
}

export function useDeleteDifficulty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/questions/difficulties/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad eliminada");
    },
    onError: () => toast.error("Error al eliminar dificultad"),
  });
}
