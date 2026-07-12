// Supabaseスキーマの型定義。
// 本番運用では `npx supabase gen types typescript --project-id <id>` で再生成すること。
// SPECIFICATION.md 5章のテーブル定義と同期させる。

type NoRelationships = { Relationships: [] };

type IngredientsRelationships = {
  Relationships: [
    {
      foreignKeyName: "ingredients_meal_id_fkey";
      columns: ["meal_id"];
      isOneToOne: false;
      referencedRelation: "meals";
      referencedColumns: ["id"];
    },
  ];
};

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          target_calorie_kcal: number;
          target_protein_g: number;
          target_fat_g: number;
          target_carbohydrate_g: number;
          target_salt_g: number;
          target_weight_kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      } & NoRelationships;
      meals: {
        Row: {
          id: string;
          user_id: string;
          eaten_at: string;
          meal_type: "朝食" | "昼食" | "夕食" | "間食";
          meal_timing: "朝" | "昼" | "夜" | "深夜" | null;
          menu_name: string;
          category: string | null;
          serving_size: string | null;
          calorie_kcal: number;
          protein_g: number;
          fat_g: number;
          carbohydrate_g: number;
          fiber_g: number | null;
          salt_g: number | null;
          confidence: number | null;
          evaluation: string | null;
          advice: string | null;
          photo_url: string | null;
          raw_json: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["meals"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["meals"]["Row"]>;
      } & NoRelationships;
      ingredients: {
        Row: {
          id: string;
          meal_id: string;
          user_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ingredients"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Row"]>;
      } & IngredientsRelationships;
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          recorded_on: string;
          weight_kg: number;
          body_fat_percent: number | null;
          muscle_mass_kg: number | null;
          bmi: number | null;
          visceral_fat_level: number | null;
          basal_metabolism_kcal: number | null;
          body_age: number | null;
          bone_mass_kg: number | null;
          muscle_quality_score: number | null;
          body_water_percent: number | null;
          raw_json: Record<string, unknown> | null;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["weight_logs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weight_logs"]["Row"]>;
      } & NoRelationships;
      daily_summaries: {
        Row: {
          id: string;
          user_id: string;
          summary_date: string;
          total_calorie_kcal: number;
          total_protein_g: number;
          total_fat_g: number;
          total_carbohydrate_g: number;
          total_fiber_g: number;
          total_salt_g: number;
          meal_count: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_summaries"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_summaries"]["Row"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
