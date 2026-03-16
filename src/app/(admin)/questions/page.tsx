"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, type QuestionFormValues } from "@/lib/validators";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { useAllCategories } from "@/hooks/use-categories";
import { useAllDifficulties } from "@/hooks/use-difficulties";
import type { Question } from "@/types";
import { DataTable, type Column } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function QuestionsPage() {
  const [page, setPage] = useState(1);
  const [filterCat, setFilterCat] = useState<string | undefined>();
  const [filterDiff, setFilterDiff] = useState<string | undefined>();

  const { data, isLoading } = useQuestions({
    page,
    category_id: filterCat,
    difficulty_id: filterDiff,
  });
  const { data: categories } = useAllCategories();
  const { data: difficulties } = useAllDifficulties();

  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(questionSchema) as any,
    defaultValues: {
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: "options" });
  const watchedOptions = watch("options");

  const openCreate = () => {
    setEditing(null);
    reset({
      content: "",
      category_id: "",
      difficulty_id: "",
      is_premium: false,
      base_score: 10,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    });
    setFormOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    reset({
      content: q.content,
      category_id: q.category.id,
      difficulty_id: q.difficulty.id,
      is_premium: q.is_premium,
      base_score: q.base_score,
      options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
    });
    setFormOpen(true);
  };

  const setCorrectOption = (idx: number) => {
    watchedOptions.forEach((_, i) => {
      setValue(`options.${i}.is_correct`, i === idx);
    });
  };

  const onSubmit = (values: QuestionFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const columns: Column<Question>[] = [
    {
      header: "Contenido",
      accessor: (row) => (
        <span className="line-clamp-2 max-w-xs">{row.content}</span>
      ),
    },
    { header: "Categoría", accessor: (row) => row.category?.name ?? "—" },
    { header: "Dificultad", accessor: (row) => row.difficulty?.name ?? "—" },
    {
      header: "Premium",
      accessor: (row) =>
        row.is_premium ? (
          <Badge variant="default">Sí</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        ),
    },
    { header: "Puntaje", accessor: (row) => row.base_score },
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
        <h1 className="text-2xl font-bold">Preguntas</h1>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Crear
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={filterCat?.toString() ?? "all"}
          onValueChange={(v) => {
            setFilterCat(!v || v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterDiff?.toString() ?? "all"}
          onValueChange={(v) => {
            setFilterDiff(!v || v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las dificultades</SelectItem>
            {difficulties?.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        title={editing ? "Editar Pregunta" : "Crear Pregunta"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Contenido</Label>
            <Textarea {...register("content")} rows={3} />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={watch("category_id") || undefined}
                onValueChange={(v) => setValue("category_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs text-destructive">{errors.category_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Dificultad</Label>
              <Select
                value={watch("difficulty_id") || undefined}
                onValueChange={(v) => setValue("difficulty_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty_id && (
                <p className="text-xs text-destructive">{errors.difficulty_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Puntaje base</Label>
              <Input type="number" {...register("base_score")} />
              {errors.base_score && (
                <p className="text-xs text-destructive">{errors.base_score.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                checked={watch("is_premium")}
                onCheckedChange={(v) => setValue("is_premium", !!v)}
              />
              <Label>Premium</Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Opciones (marca la correcta)</Label>
            {errors.options && typeof errors.options === "object" && "message" in errors.options && (
              <p className="text-xs text-destructive">{errors.options.message as string}</p>
            )}
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct_option"
                  checked={watchedOptions[idx]?.is_correct ?? false}
                  onChange={() => setCorrectOption(idx)}
                  className="h-4 w-4 accent-green-600"
                />
                <Input
                  {...register(`options.${idx}.text`)}
                  placeholder={`Opción ${idx + 1}`}
                  className="flex-1"
                />
              </div>
            ))}
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
        title="Eliminar Pregunta"
        description="¿Estás seguro de eliminar esta pregunta?"
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
