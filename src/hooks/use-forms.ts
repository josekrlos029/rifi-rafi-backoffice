"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, FormModel, CreateFormModel } from "@/types";
import { toast } from "sonner";

export function useForms(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["forms", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FormModel>>("/forms", {
        params: { page, limit },
      });
      return data;
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
    mutationFn: async ({ id, ...body }: CreateFormModel & { id: number }) => {
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
    mutationFn: async (id: number) => {
      await apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Formulario eliminado");
    },
    onError: () => toast.error("Error al eliminar formulario"),
  });
}
