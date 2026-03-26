"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { applyCompanyOwnershipFilter } from "@/lib/ownership-guards";
import { buildRoleScopedParams } from "@/lib/role-scope";
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
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const isEnabled = role === "ADMIN" || role === "COMPANY";

  return useQuery({
    queryKey: ["gym-configs", page, limit, role, companyId],
    enabled: isEnabled,
    queryFn: async () => {
      const params = buildRoleScopedParams({ page, limit }, { role, companyId });
      const { data } = await apiClient.get<GymConfigsApiResponse>("/gym/configs", {
        params,
      });
      const normalized = normalizeGymConfigsResponse(data);
      return {
        ...normalized,
        items: applyCompanyOwnershipFilter(normalized.items, {
          role,
          companyId,
          allowGlobalWhenCompanyMissing: false,
        }),
      };
    },
  });
}

export function useCreateGymConfig() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async (body: CreateGymConfig) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const { data } = await apiClient.post("/gym/configs", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración creada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para crear configuraciones");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al crear configuración");
    },
  });
}

export function useUpdateGymConfig() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async ({ id, ...body }: CreateGymConfig & { id: string | number }) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      const { data } = await apiClient.patch(`/gym/configs/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración actualizada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para actualizar configuraciones");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al actualizar configuración");
    },
  });
}

export function useDeleteGymConfig() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  return useMutation({
    mutationFn: async (id: string | number) => {
      if (role === "UNKNOWN" || role === "USER") {
        throw new Error("FORBIDDEN_ROLE");
      }
      if (role === "COMPANY" && !companyId) {
        throw new Error("MISSING_COMPANY_SCOPE");
      }
      await apiClient.delete(`/gym/configs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-configs"] });
      toast.success("Configuración eliminada");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
        toast.error("No tienes permisos para eliminar configuraciones");
        return;
      }
      if (error instanceof Error && error.message === "MISSING_COMPANY_SCOPE") {
        toast.error("No se detectó company_id en tu sesión");
        return;
      }
      toast.error("Error al eliminar configuración");
    },
  });
}
