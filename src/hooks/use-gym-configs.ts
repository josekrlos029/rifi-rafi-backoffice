"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, GymConfig, CreateGymConfig, QuestionCategory } from "@/types";
import { toast } from "sonner";

type CategoryApiItem = Omit<QuestionCategory, "id"> & { id: string | number };
type GymConfigApiItem = Omit<GymConfig, "categories"> & { categories?: CategoryApiItem[] };

type GymConfigsApiResponse = Omit<PaginatedResponse<GymConfig>, "items"> & {
  items?: GymConfigApiItem[];
  configs?: GymConfigApiItem[];
  gym_configs?: GymConfigApiItem[];
};

function normalizeGymConfig(item: GymConfigApiItem): GymConfig {
  return {
    ...item,
    categories: (item.categories ?? []).map((category) => ({
      ...category,
      id: String(category.id),
    })),
  };
}

function normalizeGymConfigsResponse(data: GymConfigsApiResponse): PaginatedResponse<GymConfig> {
  const source = data.items ?? data.configs ?? data.gym_configs ?? [];
  return {
    total: data.total,
    page: data.page,
    limit: data.limit,
    total_pages: data.total_pages,
    items: source.map(normalizeGymConfig),
  };
}

export function useGymConfigs(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["gym-configs", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<GymConfigsApiResponse>("/gym/configs", {
        params: { page, limit },
      });
      return normalizeGymConfigsResponse(data);
    },
  });
}

export function useCreateGymConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateGymConfig) => {
      const { data } = await apiClient.post("/gym/configs", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración creada");
    },
    onError: () => toast.error("Error al crear configuración"),
  });
}

export function useUpdateGymConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateGymConfig & { id: string | number }) => {
      const { data } = await apiClient.patch(`/gym/configs/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración actualizada");
    },
    onError: () => toast.error("Error al actualizar configuración"),
  });
}

export function useDeleteGymConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/gym/configs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración eliminada");
    },
    onError: () => toast.error("Error al eliminar configuración"),
  });
}
