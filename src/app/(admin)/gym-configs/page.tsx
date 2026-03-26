"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gymConfigSchema, type GymConfigFormValues } from "@/lib/validators";
import {
  useGymConfigs,
  useCreateGymConfig,
  useUpdateGymConfig,
  useDeleteGymConfig,
} from "@/hooks/use-gym-configs";
import { useAllCategories } from "@/hooks/use-categories";
import type { GymConfig } from "@/types";
import { DataTable, type Column } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRoleAccess } from "@/hooks/use-role-access";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function GymConfigsPage() {
  const { canManageGymConfigs, canMutateManagedResources } = useRoleAccess();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGymConfigs(page);
  const { data: categories } = useAllCategories();
  const createMutation = useCreateGymConfig();
  const updateMutation = useUpdateGymConfig();
  const deleteMutation = useDeleteGymConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GymConfig | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<GymConfigFormValues>({ resolver: zodResolver(gymConfigSchema) as any });

  const watchedCategoryIds = watch("category_ids") ?? [];

  const openCreate = () => {
    if (!canMutateManagedResources) return;
    setEditing(null);
    reset({
      name: "",
      description: "",
      duration_seconds: 300,
      time_per_question: 30,
      is_active: true,
      category_ids: [],
    });
    setFormOpen(true);
  };

  const openEdit = (gc: GymConfig) => {
    if (!canMutateManagedResources) return;
    setEditing(gc);
    reset({
      name: gc.name,
      description: gc.description,
      duration_seconds: gc.duration_seconds,
      time_per_question: gc.time_per_question,
      is_active: gc.is_active,
      category_ids: gc.categories?.map((c) => c.id) ?? [],
    });
    setFormOpen(true);
  };

  const toggleCategory = (id: string) => {
    const current = watchedCategoryIds;
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setValue("category_ids", next, { shouldValidate: true });
  };

  const onSubmit = (values: GymConfigFormValues) => {
    if (!canMutateManagedResources) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const columns: Column<GymConfig>[] = [
    { header: "Nombre", accessor: "name" },
    { header: "Duración (seg)", accessor: (row) => row.duration_seconds },
    { header: "Tiempo/Pregunta", accessor: (row) => row.time_per_question },
    {
      header: "Activo",
      accessor: (row) =>
        row.is_active ? (
          <Badge className="bg-green-100 text-green-700">Sí</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        ),
    },
    {
      header: "Categorías",
      accessor: (row) => row.categories?.length ?? 0,
    },
  ];

  if (canManageGymConfigs) {
    columns.push({
      header: "Acciones",
      className: "w-24",
      accessor: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row)}
            disabled={!canMutateManagedResources}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row)}
            disabled={!canMutateManagedResources}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuraciones del Gimnasio</h1>
        <Button
          onClick={openCreate}
          className="bg-green-600 hover:bg-green-700"
          disabled={!canMutateManagedResources}
        >
          <Plus className="mr-2 h-4 w-4" /> Crear
        </Button>
      </div>

      {!canManageGymConfigs && (
        <Alert>
          <AlertDescription>
            No tienes permisos para administrar configuraciones del gimnasio.
          </AlertDescription>
        </Alert>
      )}

      {canManageGymConfigs && !canMutateManagedResources && (
        <Alert>
          <AlertDescription>
            No se detectó company_id en el token. Las mutaciones se bloquean por seguridad.
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={canManageGymConfigs ? data?.items ?? [] : []}
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar Configuración" : "Crear Configuración"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración (segundos)</Label>
              <Input type="number" {...register("duration_seconds")} />
              {errors.duration_seconds && (
                <p className="text-xs text-destructive">{errors.duration_seconds.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tiempo por pregunta (seg)</Label>
              <Input type="number" {...register("time_per_question")} />
              {errors.time_per_question && (
                <p className="text-xs text-destructive">{errors.time_per_question.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={watch("is_active")}
              onCheckedChange={(v) => setValue("is_active", v)}
            />
            <Label>Activo</Label>
          </div>
          <div className="space-y-2">
            <Label>Categorías</Label>
            {errors.category_ids && (
              <p className="text-xs text-destructive">{errors.category_ids.message}</p>
            )}
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
              {categories?.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={watchedCategoryIds.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  {cat.name}
                </label>
              ))}
              {(!categories || categories.length === 0) && (
                <p className="text-sm text-muted-foreground">No hay categorías disponibles</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={!canMutateManagedResources || createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar Configuración"
        description={`¿Estás seguro de eliminar "${deleteTarget?.name}"?`}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
        isLoading={!canMutateManagedResources || deleteMutation.isPending}
      />
    </div>
  );
}
