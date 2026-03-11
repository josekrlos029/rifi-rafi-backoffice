"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, GymConfig, CreateGymConfig } from "@/types";
import { toast } from "sonner";

export function useGymConfigs(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["gym-configs", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<GymConfig>>("/gym/configs", {
        params: { page, limit },
      });
      return data;
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
    mutationFn: async ({ id, ...body }: CreateGymConfig & { id: number }) => {
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/gym/configs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración eliminada");
    },
    onError: () => toast.error("Error al eliminar configuración"),
  });
}
