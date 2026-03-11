import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Identificador requerido"),
  password: z.string().min(1, "Contraseña requerida"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().min(10, "Mínimo 10 caracteres").max(1024),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const difficultySchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().min(10, "Mínimo 10 caracteres").max(1024),
  multiplier: z.coerce.number().min(0.1, "Mínimo 0.1"),
});
export type DifficultyFormValues = { name: string; description: string; multiplier: number };

const optionSchema = z.object({
  text: z.string().min(1, "Texto requerido"),
  is_correct: z.boolean(),
});

export const questionSchema = z
  .object({
    content: z.string().min(5, "Mínimo 5 caracteres").max(1024),
    category_id: z.coerce.number().min(1, "Selecciona una categoría"),
    difficulty_id: z.coerce.number().min(1, "Selecciona una dificultad"),
    is_premium: z.boolean(),
    base_score: z.coerce.number().min(5, "Mínimo 5"),
    options: z.array(optionSchema).length(4, "Debe haber 4 opciones"),
  })
  .refine((data) => data.options.filter((o) => o.is_correct).length === 1, {
    message: "Exactamente una opción debe ser correcta",
    path: ["options"],
  });
export type QuestionFormValues = {
  content: string;
  category_id: number;
  difficulty_id: number;
  is_premium: boolean;
  base_score: number;
  options: { text: string; is_correct: boolean }[];
};

export const gymConfigSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().min(10, "Mínimo 10 caracteres").max(1024),
  duration_seconds: z.coerce.number().min(30).max(3600),
  time_per_question: z.coerce.number().min(5).max(300),
  is_active: z.boolean(),
  category_ids: z.array(z.number()).min(1, "Selecciona al menos una categoría"),
});
export type GymConfigFormValues = {
  name: string;
  description: string;
  duration_seconds: number;
  time_per_question: number;
  is_active: boolean;
  category_ids: number[];
};

export const formModelSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().min(10, "Mínimo 10 caracteres").max(1024),
  num_questions: z.coerce.number().min(5).max(50),
  time_per_question: z.coerce.number().min(10).max(300),
  use_only_own_questions: z.boolean(),
  token_price: z.coerce.number().min(0).optional(),
  category_ids: z.array(z.number()).min(1, "Selecciona al menos una categoría"),
  difficulty_pattern: z.array(z.number()),
});
export type FormModelFormValues = {
  title: string;
  description: string;
  num_questions: number;
  time_per_question: number;
  use_only_own_questions: boolean;
  token_price?: number;
  category_ids: number[];
  difficulty_pattern: number[];
};
