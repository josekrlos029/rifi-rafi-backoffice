"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, QuestionCategory, CreateCategory } from "@/types";
import { toast } from "sonner";

export function useCategories(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["categories", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<QuestionCategory>>(
        "/questions/categories",
        { params: { page, limit } }
      );
      return data;
    },
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<QuestionCategory>>(
        "/questions/categories",
        { params: { limit: 100 } }
      );
      return data.items;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateCategory) => {
      const { data } = await apiClient.post("/questions/categories", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
    onError: () => toast.error("Error al crear categoría"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateCategory & { id: number }) => {
      const { data } = await apiClient.patch(`/questions/categories/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
    },
    onError: () => toast.error("Error al actualizar categoría"),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/questions/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: () => toast.error("Error al eliminar categoría"),
  });
}
