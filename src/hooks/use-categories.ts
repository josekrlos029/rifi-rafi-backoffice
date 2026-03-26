"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
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
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["categories", page, limit, role, companyId],
    enabled: isEnabled,
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
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["categories", "all", role, companyId],
    enabled: isEnabled,
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
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async (body: CreateCategory) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      const { data } = await apiClient.post("/questions/categories", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede crear categorías");
        return;
      }
      toast.error("Error al crear categoría");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateCategory & { id: string }) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      const { data } = await apiClient.patch(`/questions/categories/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede actualizar categorías");
        return;
      }
      toast.error("Error al actualizar categoría");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async (id: string) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      await apiClient.delete(`/questions/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede eliminar categorías");
        return;
      }
      toast.error("Error al eliminar categoría");
    },
  });
}
