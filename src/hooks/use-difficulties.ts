"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, QuestionDifficulty, CreateDifficulty } from "@/types";
import { toast } from "sonner";

export function useDifficulties(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["difficulties", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<QuestionDifficulty>>(
        "/questions/difficulties",
        { params: { page, limit } }
      );
      return data;
    },
  });
}

export function useAllDifficulties() {
  return useQuery({
    queryKey: ["difficulties", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<QuestionDifficulty>>(
        "/questions/difficulties",
        { params: { limit: 100 } }
      );
      return data.items;
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
    mutationFn: async ({ id, ...body }: CreateDifficulty & { id: number }) => {
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/questions/difficulties/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad eliminada");
    },
    onError: () => toast.error("Error al eliminar dificultad"),
  });
}
