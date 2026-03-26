"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
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
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["difficulties", page, limit, role, companyId],
    enabled: isEnabled,
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
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["difficulties", "all", role, companyId],
    enabled: isEnabled,
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
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async (body: CreateDifficulty) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      const { data } = await apiClient.post("/questions/difficulties", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad creada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede crear dificultades");
        return;
      }
      toast.error("Error al crear dificultad");
    },
  });
}

export function useUpdateDifficulty() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateDifficulty & { id: string }) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      const { data } = await apiClient.patch(`/questions/difficulties/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad actualizada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede actualizar dificultades");
        return;
      }
      toast.error("Error al actualizar dificultad");
    },
  });
}

export function useDeleteDifficulty() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  return useMutation({
    mutationFn: async (id: string) => {
      if (role !== "ADMIN") {
        throw new Error("FORBIDDEN_ROLE");
      }
      await apiClient.delete(`/questions/difficulties/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulties"] });
      toast.success("Dificultad eliminada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("Solo ADMIN puede eliminar dificultades");
        return;
      }
      toast.error("Error al eliminar dificultad");
    },
  });
}
