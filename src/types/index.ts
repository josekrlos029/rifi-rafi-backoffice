// Auth
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
}

// Pagination
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: T[];
}

// Categories
export interface QuestionCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Difficulties
export interface QuestionDifficulty {
  id: number;
  name: string;
  description: string;
  multiplier: number;
  created_at: string;
  updated_at: string;
}

// Question Options
export interface QuestionOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

// Questions
export interface Question {
  id: number;
  content: string;
  is_premium: boolean;
  base_score: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  options: QuestionOption[];
  created_at: string;
  updated_at: string;
}

// Gym Configs
export interface GymConfig {
  id: number;
  name: string;
  description: string;
  duration_seconds: number;
  time_per_question: number;
  is_active: boolean;
  categories: QuestionCategory[];
  created_at: string;
  updated_at: string;
}

// Forms
export interface FormModel {
  id: number;
  title: string;
  description: string;
  num_questions: number;
  time_per_question: number;
  use_only_own_questions: boolean;
  token_price: number | null;
  categories: QuestionCategory[];
  difficulty_pattern: QuestionDifficulty[];
  created_at: string;
  updated_at: string;
}

// Create/Update DTOs
export interface CreateGymConfig {
  name: string;
  description: string;
  duration_seconds: number;
  time_per_question: number;
  is_active: boolean;
  category_ids: number[];
}

export interface CreateFormModel {
  title: string;
  description: string;
  num_questions: number;
  time_per_question: number;
  use_only_own_questions: boolean;
  token_price?: number;
  category_ids: number[];
  difficulty_pattern: number[];
}

export interface CreateQuestion {
  content: string;
  category_id: number;
  difficulty_id: number;
  is_premium: boolean;
  base_score: number;
  options: { text: string; is_correct: boolean }[];
}

export interface CreateCategory {
  name: string;
  description: string;
}

export interface CreateDifficulty {
  name: string;
  description: string;
  multiplier: number;
}
