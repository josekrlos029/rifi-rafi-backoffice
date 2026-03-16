"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, QuestionCategory, CreateCategory } from "@/types";
import { toast } from "sonner";

type CategoriesApiResponse = Omit<PaginatedResponse<QuestionCategory>, "items"> & {
  items?: QuestionCategory[];
  categories?: QuestionCategory[];
};

function normalizeCategoriesResponse(data: CategoriesApiResponse): PaginatedResponse<QuestionCategory> {
  return {
    total: data.total,
    page: data.page,
    limit: data.limit,
    total_pages: data.total_pages,
    items: data.items ?? data.categories ?? [],
  };
}

export function useCategories(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["categories", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<CategoriesApiResponse>(
        "/questions/categories",
        { params: { page, limit } }
      );
      return normalizeCategoriesResponse(data);
    },
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<CategoriesApiResponse>(
        "/questions/categories",
        { params: { limit: 100 } }
      );
      return normalizeCategoriesResponse(data).items;
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
    mutationFn: async ({ id, ...body }: CreateCategory & { id: string }) => {
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
    mutationFn: async (id: string) => {
      await apiClient.delete(`/questions/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: () => toast.error("Error al eliminar categoría"),
  });
}
