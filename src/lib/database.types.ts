export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      marketplace_sources: {
        Row: {
          id: string;
          source_id: string;
          name: string;
          content_feed_url: string;
          source_url: string | null;
          feed_schema_version: string | null;
          language: string | null;
          enabled: boolean;
          last_sync_at: string | null;
          last_successful_sync_at: string | null;
          last_sync_status: string | null;
          last_sync_error: string | null;
          webhook_secret_hash: string | null;
          webhook_secret_hint: string | null;
          credential_rotated_at: string | null;
          last_webhook_at: string | null;
          last_feed_generated_at: string | null;
          last_sync_duration_ms: number | null;
          feed_enabled: boolean;
          consecutive_failures: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          name: string;
          content_feed_url: string;
          source_url?: string | null;
          feed_schema_version?: string | null;
          language?: string | null;
          enabled?: boolean;
          last_sync_at?: string | null;
          last_successful_sync_at?: string | null;
          last_sync_status?: string | null;
          last_sync_error?: string | null;
          webhook_secret_hash?: string | null;
          webhook_secret_hint?: string | null;
          credential_rotated_at?: string | null;
          last_webhook_at?: string | null;
          last_feed_generated_at?: string | null;
          last_sync_duration_ms?: number | null;
          feed_enabled?: boolean;
          consecutive_failures?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          name?: string;
          content_feed_url?: string;
          source_url?: string | null;
          feed_schema_version?: string | null;
          language?: string | null;
          enabled?: boolean;
          last_sync_at?: string | null;
          last_successful_sync_at?: string | null;
          last_sync_status?: string | null;
          last_sync_error?: string | null;
          webhook_secret_hash?: string | null;
          webhook_secret_hint?: string | null;
          credential_rotated_at?: string | null;
          last_webhook_at?: string | null;
          last_feed_generated_at?: string | null;
          last_sync_duration_ms?: number | null;
          feed_enabled?: boolean;
          consecutive_failures?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketplace_hunts: {
        Row: {
          id: string;
          source_id: string;
          listing_id: string;
          slug: string;
          source_url: string;
          title: string;
          summary: string;
          content_status: string;
          central_moderation_status: string;
          trip_type: string;
          primary_species: string[];
          secondary_species: string[];
          country: string;
          region: string;
          duration: Json;
          season: Json;
          starting_price: number;
          currency: string;
          sections: Json;
          raw_content: Json | null;
          content_hash: string;
          content_updated_at: string;
          published: boolean;
          source_active: boolean;
          last_seen_at: string | null;
          orphaned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          listing_id: string;
          slug: string;
          source_url: string;
          title: string;
          summary: string;
          content_status?: string;
          central_moderation_status?: string;
          trip_type: string;
          primary_species?: string[];
          secondary_species?: string[];
          country: string;
          region: string;
          duration?: Json;
          season?: Json;
          starting_price: number;
          currency?: string;
          sections?: Json;
          raw_content?: Json | null;
          content_hash: string;
          content_updated_at: string;
          published?: boolean;
          source_active?: boolean;
          last_seen_at?: string | null;
          orphaned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          listing_id?: string;
          slug?: string;
          source_url?: string;
          title?: string;
          summary?: string;
          content_status?: string;
          central_moderation_status?: string;
          trip_type?: string;
          primary_species?: string[];
          secondary_species?: string[];
          country?: string;
          region?: string;
          duration?: Json;
          season?: Json;
          starting_price?: number;
          currency?: string;
          sections?: Json;
          raw_content?: Json | null;
          content_hash?: string;
          content_updated_at?: string;
          published?: boolean;
          source_active?: boolean;
          last_seen_at?: string | null;
          orphaned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_hunts_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_sources";
            referencedColumns: ["source_id"];
          },
        ];
      };
      marketplace_outfitters: {
        Row: {
          id: string;
          source_id: string;
          name: string;
          tagline: string;
          summary: string;
          profile_url: string;
          inquiry_url: string;
          logo: Json;
          profile_image: Json;
          countries: string[];
          regions: string[];
          founded: number | null;
          headquarters: string | null;
          public_contact: Json | null;
          social_urls: string[];
          content_hash: string;
          content_updated_at: string;
          central_moderation_status: string;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          name: string;
          tagline: string;
          summary: string;
          profile_url: string;
          inquiry_url: string;
          logo: Json;
          profile_image: Json;
          countries?: string[];
          regions?: string[];
          founded?: number | null;
          headquarters?: string | null;
          public_contact?: Json | null;
          social_urls?: string[];
          content_hash: string;
          content_updated_at: string;
          central_moderation_status?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          name?: string;
          tagline?: string;
          summary?: string;
          profile_url?: string;
          inquiry_url?: string;
          logo?: Json;
          profile_image?: Json;
          countries?: string[];
          regions?: string[];
          founded?: number | null;
          headquarters?: string | null;
          public_contact?: Json | null;
          social_urls?: string[];
          content_hash?: string;
          content_updated_at?: string;
          central_moderation_status?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_outfitters_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "marketplace_sources";
            referencedColumns: ["source_id"];
          },
        ];
      };
      marketplace_hunt_media: {
        Row: {
          id: string;
          hunt_id: string;
          source_url: string;
          mirrored_url: string | null;
          alt: string;
          caption: string | null;
          role: string;
          sort_order: number;
          source_hash: string | null;
          status: string;
          last_checked_at: string | null;
          last_downloaded_at: string | null;
          orphaned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hunt_id: string;
          source_url: string;
          mirrored_url?: string | null;
          alt: string;
          caption?: string | null;
          role?: string;
          sort_order?: number;
          source_hash?: string | null;
          status?: string;
          last_checked_at?: string | null;
          last_downloaded_at?: string | null;
          orphaned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hunt_id?: string;
          source_url?: string;
          mirrored_url?: string | null;
          alt?: string;
          caption?: string | null;
          role?: string;
          sort_order?: number;
          source_hash?: string | null;
          status?: string;
          last_checked_at?: string | null;
          last_downloaded_at?: string | null;
          orphaned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_media_hunt_id_fkey";
            columns: ["hunt_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_hunts";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_sync_runs: {
        Row: {
          id: string;
          source_id: string | null;
          status: string;
          started_at: string;
          finished_at: string | null;
          hunts_seen: number;
          hunts_changed: number;
          media_changed: number;
          error: string | null;
          trigger_type: string;
          feed_generated_at: string | null;
          warning_count: number;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          status: string;
          started_at?: string;
          finished_at?: string | null;
          hunts_seen?: number;
          hunts_changed?: number;
          media_changed?: number;
          error?: string | null;
          trigger_type?: string;
          feed_generated_at?: string | null;
          warning_count?: number;
        };
        Update: {
          id?: string;
          source_id?: string | null;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          hunts_seen?: number;
          hunts_changed?: number;
          media_changed?: number;
          error?: string | null;
          trigger_type?: string;
          feed_generated_at?: string | null;
          warning_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_sync_runs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_sources";
            referencedColumns: ["source_id"];
          },
        ];
      };
      marketplace_source_snapshots: {
        Row: {
          id: string;
          source_id: string;
          schema_version: string;
          content_hash: string;
          payload: Json;
          fetched_at: string;
          accepted: boolean;
          validation_errors: Json | null;
        };
        Insert: {
          id?: string;
          source_id: string;
          schema_version: string;
          content_hash: string;
          payload: Json;
          fetched_at?: string;
          accepted?: boolean;
          validation_errors?: Json | null;
        };
        Update: {
          id?: string;
          source_id?: string;
          schema_version?: string;
          content_hash?: string;
          payload?: Json;
          fetched_at?: string;
          accepted?: boolean;
          validation_errors?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_source_snapshots_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_sources";
            referencedColumns: ["source_id"];
          },
        ];
      };
      marketplace_sync_errors: {
        Row: {
          id: string;
          sync_run_id: string | null;
          source_id: string | null;
          error_code: string;
          message: string;
          record_type: string | null;
          record_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sync_run_id?: string | null;
          source_id?: string | null;
          error_code: string;
          message: string;
          record_type?: string | null;
          record_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sync_run_id?: string | null;
          source_id?: string | null;
          error_code?: string;
          message?: string;
          record_type?: string | null;
          record_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_sync_errors_sync_run_id_fkey";
            columns: ["sync_run_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_sync_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketplace_sync_errors_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_sources";
            referencedColumns: ["source_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
