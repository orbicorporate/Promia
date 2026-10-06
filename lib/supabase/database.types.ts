// Gerado a partir do banco de produção (Supabase, projeto Promia).
// Regenerar depois de cada migration: `npx supabase gen types typescript`
// ou pela ferramenta de tipos do painel. Não editar à mão.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      ai_recommendations: {
        Row: { dismissed: boolean; generated_at: string; id: string; market_id: string; priority: string; reason: string; run_id: string | null; target: string; type: string };
        Insert: { dismissed?: boolean; generated_at?: string; id?: string; market_id: string; priority: string; reason: string; run_id?: string | null; target: string; type: string };
        Update: { dismissed?: boolean; generated_at?: string; id?: string; market_id?: string; priority?: string; reason?: string; run_id?: string | null; target?: string; type?: string };
        Relationships: [{ foreignKeyName: "ai_recommendations_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      ai_usage: {
        Row: { created_at: string; id: string; kind: string; market_id: string; units: number; user_id: string | null };
        Insert: { created_at?: string; id?: string; kind: string; market_id: string; units?: number; user_id?: string | null };
        Update: { created_at?: string; id?: string; kind?: string; market_id?: string; units?: number; user_id?: string | null };
        Relationships: [{ foreignKeyName: "ai_usage_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      campaigns: {
        Row: { content: Json; created_at: string; created_by: string | null; id: string; market_id: string; tabloid_id: string; updated_at: string };
        Insert: { content: Json; created_at?: string; created_by?: string | null; id?: string; market_id: string; tabloid_id: string; updated_at?: string };
        Update: { content?: Json; created_at?: string; created_by?: string | null; id?: string; market_id?: string; tabloid_id?: string; updated_at?: string };
        Relationships: [];
      };
      content_plans: {
        Row: { content: Json; created_at: string; id: string; market_id: string; month: string; updated_at: string };
        Insert: { content: Json; created_at?: string; id?: string; market_id: string; month: string; updated_at?: string };
        Update: { content?: Json; created_at?: string; id?: string; market_id?: string; month?: string; updated_at?: string };
        Relationships: [];
      };
      sales_imports: {
        Row: { created_at: string; created_by: string | null; file_name: string | null; id: string; market_id: string; matched: number; period_end: string; period_start: string; rows: number };
        Insert: { created_at?: string; created_by?: string | null; file_name?: string | null; id?: string; market_id: string; matched?: number; period_end: string; period_start: string; rows?: number };
        Update: { created_at?: string; created_by?: string | null; file_name?: string | null; id?: string; market_id?: string; matched?: number; period_end?: string; period_start?: string; rows?: number };
        Relationships: [];
      };
      sales_records: {
        Row: { category: string | null; cost: number | null; created_at: string; id: string; import_id: string; market_id: string; name: string; period_end: string; period_start: string; product_id: string | null; qty: number; revenue: number; sku: string | null };
        Insert: { category?: string | null; cost?: number | null; created_at?: string; id?: string; import_id: string; market_id: string; name: string; period_end: string; period_start: string; product_id?: string | null; qty?: number; revenue?: number; sku?: string | null };
        Update: { category?: string | null; cost?: number | null; created_at?: string; id?: string; import_id?: string; market_id?: string; name?: string; period_end?: string; period_start?: string; product_id?: string | null; qty?: number; revenue?: number; sku?: string | null };
        Relationships: [];
      };
      competitors: {
        Row: { address: string | null; category: string | null; created_at: string; id: string; latitude: number | null; longitude: number | null; market_id: string; name: string; phone: string | null; rating: number | null; reviews: number | null; source: string; tracked: boolean; website: string | null };
        Insert: { address?: string | null; category?: string | null; created_at?: string; id?: string; latitude?: number | null; longitude?: number | null; market_id: string; name: string; phone?: string | null; rating?: number | null; reviews?: number | null; source?: string; tracked?: boolean; website?: string | null };
        Update: { address?: string | null; category?: string | null; created_at?: string; id?: string; latitude?: number | null; longitude?: number | null; market_id?: string; name?: string; phone?: string | null; rating?: number | null; reviews?: number | null; source?: string; tracked?: boolean; website?: string | null };
        Relationships: [];
      };
      competitor_flyers: {
        Row: { competitor_id: string | null; competitor_name: string; created_at: string; created_by: string | null; id: string; items: number; market_id: string; observed_on: string; valid_until: string | null };
        Insert: { competitor_id?: string | null; competitor_name: string; created_at?: string; created_by?: string | null; id?: string; items?: number; market_id: string; observed_on?: string; valid_until?: string | null };
        Update: { competitor_id?: string | null; competitor_name?: string; created_at?: string; created_by?: string | null; id?: string; items?: number; market_id?: string; observed_on?: string; valid_until?: string | null };
        Relationships: [];
      };
      competitor_prices: {
        Row: { competitor_id: string | null; competitor_name: string; created_at: string; flyer_id: string | null; id: string; market_id: string; match_score: number | null; observed_on: string; old_price: number | null; price: number; product_id: string | null; product_name: string };
        Insert: { competitor_id?: string | null; competitor_name: string; created_at?: string; flyer_id?: string | null; id?: string; market_id: string; match_score?: number | null; observed_on?: string; old_price?: number | null; price: number; product_id?: string | null; product_name: string };
        Update: { competitor_id?: string | null; competitor_name?: string; created_at?: string; flyer_id?: string | null; id?: string; market_id?: string; match_score?: number | null; observed_on?: string; old_price?: number | null; price?: number; product_id?: string | null; product_name?: string };
        Relationships: [];
      };
      market_insights: {
        Row: { content: Json; created_at: string; id: string; kind: string; market_id: string; updated_at: string };
        Insert: { content: Json; created_at?: string; id?: string; kind: string; market_id: string; updated_at?: string };
        Update: { content?: Json; created_at?: string; id?: string; kind?: string; market_id?: string; updated_at?: string };
        Relationships: [];
      };
      markets: {
        Row: { color_primary: string | null; color_secondary: string | null; created_at: string; id: string; logo_url: string | null; name: string; niche: string | null; slug: string; address: string | null; city: string | null; instagram: string | null; legal_note: string | null; onboarded_at: string | null; opening_hours: string | null; phone: string | null; tagline: string | null; whatsapp: string | null };
        Insert: { color_primary?: string | null; color_secondary?: string | null; created_at?: string; id?: string; logo_url?: string | null; name: string; niche?: string | null; slug: string; address?: string | null; city?: string | null; instagram?: string | null; legal_note?: string | null; onboarded_at?: string | null; opening_hours?: string | null; phone?: string | null; tagline?: string | null; whatsapp?: string | null };
        Update: { color_primary?: string | null; color_secondary?: string | null; created_at?: string; id?: string; logo_url?: string | null; name?: string; niche?: string | null; slug?: string; address?: string | null; city?: string | null; instagram?: string | null; legal_note?: string | null; onboarded_at?: string | null; opening_hours?: string | null; phone?: string | null; tagline?: string | null; whatsapp?: string | null };
        Relationships: [];
      };
      photo_name_bank: {
        Row: { approvals: number; image_url: string; key: string; label: string; source: string; storage_path: string | null; updated_at: string };
        Insert: { approvals?: number; image_url: string; key: string; label: string; source?: string; storage_path?: string | null; updated_at?: string };
        Update: { approvals?: number; image_url?: string; key?: string; label?: string; source?: string; storage_path?: string | null; updated_at?: string };
        Relationships: [];
      };
      photo_bank: {
        Row: { approvals: number; ean: string; image_url: string; source: string; storage_path: string | null; updated_at: string };
        Insert: { approvals?: number; ean: string; image_url: string; source?: string; storage_path?: string | null; updated_at?: string };
        Update: { approvals?: number; ean?: string; image_url?: string; source?: string; storage_path?: string | null; updated_at?: string };
        Relationships: [];
      };
      product_imports: {
        Row: { columns: Json | null; created_at: string; file_name: string | null; id: string; imported_by: string | null; market_id: string; rows_imported: number; rows_skipped: number; skipped: Json | null };
        Insert: { columns?: Json | null; created_at?: string; file_name?: string | null; id?: string; imported_by?: string | null; market_id: string; rows_imported?: number; rows_skipped?: number; skipped?: Json | null };
        Update: { columns?: Json | null; created_at?: string; file_name?: string | null; id?: string; imported_by?: string | null; market_id?: string; rows_imported?: number; rows_skipped?: number; skipped?: Json | null };
        Relationships: [{ foreignKeyName: "product_imports_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      product_price_history: {
        Row: { changed_at: string; id: string; market_id: string; new_price: number | null; old_price: number | null; product_id: string };
        Insert: { changed_at?: string; id?: string; market_id: string; new_price?: number | null; old_price?: number | null; product_id: string };
        Update: { changed_at?: string; id?: string; market_id?: string; new_price?: number | null; old_price?: number | null; product_id?: string };
        Relationships: [
          { foreignKeyName: "product_price_history_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] },
          { foreignKeyName: "product_price_history_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      products: {
        Row: { active: boolean; brand: string | null; category: string | null; cost: number | null; created_at: string; ean: string | null; id: string; image_claimed_at: string | null; image_source_url: string | null; image_status: string; image_url: string | null; market_id: string; name: string; price: number | null; sku: string; stock: number | null; unit: string | null; updated_at: string; image_candidates: Json | null; image_origin: string | null; canonical_name: string | null };
        Insert: { active?: boolean; brand?: string | null; category?: string | null; cost?: number | null; created_at?: string; ean?: string | null; id?: string; image_claimed_at?: string | null; image_source_url?: string | null; image_status?: string; image_url?: string | null; market_id: string; name: string; price?: number | null; sku: string; stock?: number | null; unit?: string | null; updated_at?: string; image_candidates?: Json | null; image_origin?: string | null; canonical_name?: string | null };
        Update: { active?: boolean; brand?: string | null; category?: string | null; cost?: number | null; created_at?: string; ean?: string | null; id?: string; image_claimed_at?: string | null; image_source_url?: string | null; image_status?: string; image_url?: string | null; market_id?: string; name?: string; price?: number | null; sku?: string; stock?: number | null; unit?: string | null; updated_at?: string; image_candidates?: Json | null; image_origin?: string | null; canonical_name?: string | null };
        Relationships: [{ foreignKeyName: "products_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: { created_at: string; email: string | null; full_name: string | null; id: string; market_id: string | null; role: string };
        Insert: { created_at?: string; email?: string | null; full_name?: string | null; id: string; market_id?: string | null; role: string };
        Update: { created_at?: string; email?: string | null; full_name?: string | null; id?: string; market_id?: string | null; role?: string };
        Relationships: [{ foreignKeyName: "profiles_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      tabloid_products: {
        Row: { position: number; product_id: string; tabloid_id: string; highlight: boolean; label: string | null; limit_qty: number | null; old_price: number | null; promo_price: number | null };
        Insert: { position?: number; product_id: string; tabloid_id: string; highlight?: boolean; label?: string | null; limit_qty?: number | null; old_price?: number | null; promo_price?: number | null };
        Update: { position?: number; product_id?: string; tabloid_id?: string; highlight?: boolean; label?: string | null; limit_qty?: number | null; old_price?: number | null; promo_price?: number | null };
        Relationships: [
          { foreignKeyName: "tabloid_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "tabloid_products_tabloid_id_fkey"; columns: ["tabloid_id"]; isOneToOne: false; referencedRelation: "tabloids"; referencedColumns: ["id"] },
        ];
      };
      tabloids: {
        Row: { category: string | null; created_at: string; id: string; market_id: string; name: string; status: string; theme_id: string | null; updated_at: string; valid_from: string | null; valid_until: string | null; created_by: string | null; format: string; headline: string | null; layout: string; subheadline: string | null; theme_key: string };
        Insert: { category?: string | null; created_at?: string; id?: string; market_id: string; name: string; status?: string; theme_id?: string | null; updated_at?: string; valid_from?: string | null; valid_until?: string | null; created_by?: string | null; format?: string; headline?: string | null; layout?: string; subheadline?: string | null; theme_key?: string };
        Update: { category?: string | null; created_at?: string; id?: string; market_id?: string; name?: string; status?: string; theme_id?: string | null; updated_at?: string; valid_from?: string | null; valid_until?: string | null; created_by?: string | null; format?: string; headline?: string | null; layout?: string; subheadline?: string | null; theme_key?: string };
        Relationships: [
          { foreignKeyName: "tabloids_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] },
          { foreignKeyName: "tabloids_theme_id_fkey"; columns: ["theme_id"]; isOneToOne: false; referencedRelation: "themes"; referencedColumns: ["id"] },
        ];
      };
      themes: {
        Row: { created_at: string; id: string; kind: string; market_id: string | null; name: string; source_seasonal_title: string | null; source_weekday: number | null; template_path: string };
        Insert: { created_at?: string; id?: string; kind: string; market_id?: string | null; name: string; source_seasonal_title?: string | null; source_weekday?: number | null; template_path: string };
        Update: { created_at?: string; id?: string; kind?: string; market_id?: string | null; name?: string; source_seasonal_title?: string | null; source_weekday?: number | null; template_path?: string };
        Relationships: [{ foreignKeyName: "themes_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
      weekly_promotions: {
        Row: { active: boolean; category_hint: string | null; created_at: string; id: string; market_id: string; name: string; weekday: number };
        Insert: { active?: boolean; category_hint?: string | null; created_at?: string; id?: string; market_id: string; name: string; weekday: number };
        Update: { active?: boolean; category_hint?: string | null; created_at?: string; id?: string; market_id?: string; name?: string; weekday?: number };
        Relationships: [{ foreignKeyName: "weekly_promotions_market_id_fkey"; columns: ["market_id"]; isOneToOne: false; referencedRelation: "markets"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_pending_images: {
        Args: { p_limit: number; p_market: string };
        Returns: { brand: string; ean: string; id: string; name: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];

// mantém o tipo auxiliar referenciado (útil se alguém precisar descrever relações à mão)
export type Relationship = Rel;
