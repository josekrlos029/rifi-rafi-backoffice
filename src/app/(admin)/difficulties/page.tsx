"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { difficultySchema, type DifficultyFormValues } from "@/lib/validators";
import {
  useDifficulties,
  useCreateDifficulty,
  useUpdateDifficulty,
  useDeleteDifficulty,
} from "@/hooks/use-difficulties";
import type { QuestionDifficulty } from "@/types";
import { DataTable, type Column } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function DifficultiesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDifficulties(page);
  const createMutation = useCreateDifficulty();
  const updateMutation = useUpdateDifficulty();
  const deleteMutation = useDeleteDifficulty();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionDifficulty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionDifficulty | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<DifficultyFormValues>({ resolver: zodResolver(difficultySchema) as any });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", multiplier: 1 });
    setFormOpen(true);
  };

  const openEdit = (diff: QuestionDifficulty) => {
    setEditing(diff);
    reset({ name: diff.name, description: diff.description, multiplier: diff.multiplier });
    setFormOpen(true);
  };

  const onSubmit = (values: DifficultyFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const columns: Column<QuestionDifficulty>[] = [
    { header: "Nombre", accessor: "name" },
    { header: "Descripción", accessor: "description" },
    { header: "Multiplicador", accessor: (row) => row.multiplier.toFixed(1) },
    {
      header: "Acciones",
      className: "w-24",
      accessor: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dificultades</h1>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Crear
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar Dificultad" : "Crear Dificultad"}
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
          <div className="space-y-2">
            <Label>Multiplicador</Label>
            <Input type="number" step="0.1" {...register("multiplier")} />
            {errors.multiplier && (
              <p className="text-xs text-destructive">{errors.multiplier.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar Dificultad"
        description={`¿Estás seguro de eliminar "${deleteTarget?.name}"?`}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
