/**
 * Tipos do banco, espelhando supabase/migrations/.
 *
 * Mantidos à mão para o repositório continuar tipado sem depender de um
 * projeto Supabase ativo. Para regerar a partir do banco:
 *
 *   supabase gen types typescript --linked > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PrioridadeTarefa = "baixa" | "media" | "alta";
export type StatusTarefa = "pendente" | "concluida";
export type TipoRecorrencia = "diaria" | "semanal" | "mensal";

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          area_id: string | null;
          title: string;
          description: string | null;
          priority: PrioridadeTarefa;
          status: StatusTarefa;
          due_date: string | null;
          completed_at: string | null;
          recurrence: TipoRecorrencia | null;
          recurrence_weekdays: number[] | null;
          recurrence_day_of_month: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          area_id?: string | null;
          title: string;
          description?: string | null;
          priority?: PrioridadeTarefa;
          status?: StatusTarefa;
          due_date?: string | null;
          completed_at?: string | null;
          recurrence?: TipoRecorrencia | null;
          recurrence_weekdays?: number[] | null;
          recurrence_day_of_month?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          area_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: PrioridadeTarefa;
          status?: StatusTarefa;
          due_date?: string | null;
          completed_at?: string | null;
          recurrence?: TipoRecorrencia | null;
          recurrence_weekdays?: number[] | null;
          recurrence_day_of_month?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_occurrences: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          due_date: string;
          status: StatusTarefa;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          due_date: string;
          status?: StatusTarefa;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          due_date?: string;
          status?: StatusTarefa;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          target_weekdays: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          target_weekdays?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          target_weekdays?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          area_id: string | null;
          title: string;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          area_id?: string | null;
          title: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          area_id?: string | null;
          title?: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habit_checkins: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      task_priority: PrioridadeTarefa;
      task_status: StatusTarefa;
      recurrence_type: TipoRecorrencia;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

type Tabelas = Database["public"]["Tables"];

export type LinhaArea = Tabelas["areas"]["Row"];
export type LinhaTarefa = Tabelas["tasks"]["Row"];
export type LinhaOcorrencia = Tabelas["task_occurrences"]["Row"];
export type LinhaHabito = Tabelas["habits"]["Row"];
export type LinhaCheckin = Tabelas["habit_checkins"]["Row"];
export type LinhaNota = Tabelas["notes"]["Row"];
