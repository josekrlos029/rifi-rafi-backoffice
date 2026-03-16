"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formModelSchema, type FormModelFormValues } from "@/lib/validators";
import { useForms, useCreateForm, useUpdateForm, useDeleteForm } from "@/hooks/use-forms";
import { useAllCategories } from "@/hooks/use-categories";
import { useAllDifficulties } from "@/hooks/use-difficulties";
import type { FormModel } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, X, GripVertical } from "lucide-react";

export default function FormsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useForms(page);
  const { data: categories } = useAllCategories();
  const { data: difficulties } = useAllDifficulties();
  const createMutation = useCreateForm();
  const updateMutation = useUpdateForm();
  const deleteMutation = useDeleteForm();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormModel | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormModelFormValues>({ resolver: zodResolver(formModelSchema) as any });

  const watchedCategoryIds = watch("category_ids") ?? [];
  const watchedPattern = watch("difficulty_pattern") ?? [];

  const openCreate = () => {
    setEditing(null);
    reset({
      title: "",
      description: "",
      num_questions: 10,
      time_per_question: 30,
      use_only_own_questions: false,
      token_price: 0,
      category_ids: [],
      difficulty_pattern: [],
    });
    setFormOpen(true);
  };

  const openEdit = (f: FormModel) => {
    setEditing(f);
    reset({
      title: f.title,
      description: f.description,
      num_questions: f.num_questions,
      time_per_question: f.time_per_question,
      use_only_own_questions: f.use_only_own_questions,
      token_price: f.token_price ?? 0,
      category_ids: f.categories?.map((c) => c.id) ?? [],
      difficulty_pattern: f.difficulty_pattern?.map((d) => d.id) ?? [],
    });
    setFormOpen(true);
  };

  const toggleCategory = (id: string) => {
    const current = watchedCategoryIds;
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setValue("category_ids", next, { shouldValidate: true });
  };

  const addDifficultyToPattern = (id: string) => {
    setValue("difficulty_pattern", [...watchedPattern, id]);
  };

  const removeDifficultyFromPattern = (index: number) => {
    setValue(
      "difficulty_pattern",
      watchedPattern.filter((_, i) => i !== index)
    );
  };

  const moveDifficulty = (from: number, to: number) => {
    const arr = [...watchedPattern];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setValue("difficulty_pattern", arr);
  };

  const onSubmit = (values: FormModelFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const getDifficultyName = (id: string) => difficulties?.find((d) => d.id === id)?.name ?? `#${id}`;

  const columns: Column<FormModel>[] = [
    { header: "Título", accessor: "title" },
    { header: "# Preguntas", accessor: (row) => row.num_questions },
    { header: "Tiempo/Pregunta", accessor: (row) => `${row.time_per_question}s` },
    {
      header: "Solo Propias",
      accessor: (row) =>
        row.use_only_own_questions ? (
          <Badge className="bg-green-100 text-green-700">Sí</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        ),
    },
    {
      header: "Precio Token",
      accessor: (row) => row.token_price ?? "—",
    },
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
        <h1 className="text-2xl font-bold">Formularios</h1>
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
        title={editing ? "Editar Formulario" : "Crear Formulario"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
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
              <Label># Preguntas</Label>
              <Input type="number" {...register("num_questions")} />
              {errors.num_questions && (
                <p className="text-xs text-destructive">{errors.num_questions.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tiempo/Pregunta (seg)</Label>
              <Input type="number" {...register("time_per_question")} />
              {errors.time_per_question && (
                <p className="text-xs text-destructive">{errors.time_per_question.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={watch("use_only_own_questions")}
                onCheckedChange={(v) => setValue("use_only_own_questions", v)}
              />
              <Label>Solo preguntas propias</Label>
            </div>
            <div className="space-y-2">
              <Label>Precio Token</Label>
              <Input type="number" step="1" {...register("token_price")} />
            </div>
          </div>

          {/* Category multi-select */}
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
            </div>
          </div>

          {/* Difficulty pattern builder */}
          <div className="space-y-2">
            <Label>Patrón de Dificultad</Label>
            <div className="flex gap-2">
              <Select onValueChange={(v) => addDifficultyToPattern(String(v ?? ""))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Agregar dificultad..." />
                </SelectTrigger>
                <SelectContent>
                  {difficulties?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {watchedPattern.length > 0 && (
              <div className="space-y-1 rounded-md border p-2">
                {watchedPattern.map((diffId, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-sm"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                    <span className="flex-1">{getDifficultyName(diffId)}</span>
                    {idx > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveDifficulty(idx, idx - 1)}
                      >
                        ↑
                      </Button>
                    )}
                    {idx < watchedPattern.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveDifficulty(idx, idx + 1)}
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeDifficultyFromPattern(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
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
        title="Eliminar Formulario"
        description={`¿Estás seguro de eliminar "${deleteTarget?.title}"?`}
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
