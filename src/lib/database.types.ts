export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      marketplace_hunt_lodges: {
        Row: {
          created_at: string
          hunt_id: string
          included_nights: number | null
          lodge_record_id: string
          region_key: string
          region_name: string
          sort_order: number
          summary: string | null
          transfer_notes: string | null
          updated_at: string
          usage: string
        }
        Insert: {
          created_at?: string
          hunt_id: string
          included_nights?: number | null
          lodge_record_id: string
          region_key: string
          region_name: string
          sort_order?: number
          summary?: string | null
          transfer_notes?: string | null
          updated_at?: string
          usage: string
        }
        Update: {
          created_at?: string
          hunt_id?: string
          included_nights?: number | null
          lodge_record_id?: string
          region_key?: string
          region_name?: string
          sort_order?: number
          summary?: string | null
          transfer_notes?: string | null
          updated_at?: string
          usage?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_lodges_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_hunt_media: {
        Row: {
          alt: string
          caption: string | null
          created_at: string
          hunt_id: string
          id: string
          last_checked_at: string | null
          last_downloaded_at: string | null
          mirrored_url: string | null
          orphaned_at: string | null
          role: string
          sort_order: number
          source_hash: string | null
          source_url: string
          status: string
          updated_at: string
        }
        Insert: {
          alt: string
          caption?: string | null
          created_at?: string
          hunt_id: string
          id?: string
          last_checked_at?: string | null
          last_downloaded_at?: string | null
          mirrored_url?: string | null
          orphaned_at?: string | null
          role?: string
          sort_order?: number
          source_hash?: string | null
          source_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          alt?: string
          caption?: string | null
          created_at?: string
          hunt_id?: string
          id?: string
          last_checked_at?: string | null
          last_downloaded_at?: string | null
          mirrored_url?: string | null
          orphaned_at?: string | null
          role?: string
          sort_order?: number
          source_hash?: string | null
          source_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_media_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_media_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_hunt_destinations: {
        Row: {
          coordinates: Json | null
          country_key: string
          country_name: string
          created_at: string
          hunt_id: string
          id: string
          privacy_mode: string
          region_key: string
          region_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          coordinates?: Json | null
          country_key: string
          country_name: string
          created_at?: string
          hunt_id: string
          id?: string
          privacy_mode: string
          region_key: string
          region_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          coordinates?: Json | null
          country_key?: string
          country_name?: string
          created_at?: string
          hunt_id?: string
          id?: string
          privacy_mode?: string
          region_key?: string
          region_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_destinations_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_destinations_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_hunts: {
        Row: {
          accommodations: Json
          central_moderation_status: string
          classification: Json
          content_hash: string
          content_status: string
          content_updated_at: string
          created_at: string
          currency: string
          duration: Json
          duration_and_party: Json
          editorial: Json
          equipment_and_licenses: Json
          exclusions: Json
          faqs: Json
          id: string
          inclusions: Json
          itinerary: Json
          last_seen_at: string | null
          listing_id: string
          methods_and_guiding: Json
          moderation_changed_at: string | null
          moderation_changed_by: string | null
          moderation_reason: string | null
          optional_services: Json
          orphaned_at: string | null
          pricing: Json
          primary_species: string[]
          published: boolean
          raw_content: Json | null
          season: Json
          season_and_availability: Json
          secondary_species: string[]
          sections: Json
          slug: string
          source_active: boolean
          source_id: string
          source_url: string
          starting_price: number
          summary: string
          terms: Json
          territory: Json | null
          title: string
          travel: Json
          trip_type: string
          updated_at: string
        }
        Insert: {
          accommodations?: Json
          central_moderation_status?: string
          classification?: Json
          content_hash: string
          content_status?: string
          content_updated_at: string
          created_at?: string
          currency?: string
          duration?: Json
          duration_and_party?: Json
          editorial?: Json
          equipment_and_licenses?: Json
          exclusions?: Json
          faqs?: Json
          id?: string
          inclusions?: Json
          itinerary?: Json
          last_seen_at?: string | null
          listing_id: string
          methods_and_guiding?: Json
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          optional_services?: Json
          orphaned_at?: string | null
          pricing?: Json
          primary_species?: string[]
          published?: boolean
          raw_content?: Json | null
          season?: Json
          season_and_availability?: Json
          secondary_species?: string[]
          sections?: Json
          slug: string
          source_active?: boolean
          source_id: string
          source_url: string
          starting_price: number
          summary: string
          terms?: Json
          territory?: Json | null
          title: string
          travel?: Json
          trip_type: string
          updated_at?: string
        }
        Update: {
          accommodations?: Json
          central_moderation_status?: string
          classification?: Json
          content_hash?: string
          content_status?: string
          content_updated_at?: string
          created_at?: string
          currency?: string
          duration?: Json
          duration_and_party?: Json
          editorial?: Json
          equipment_and_licenses?: Json
          exclusions?: Json
          faqs?: Json
          id?: string
          inclusions?: Json
          itinerary?: Json
          last_seen_at?: string | null
          listing_id?: string
          methods_and_guiding?: Json
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          optional_services?: Json
          orphaned_at?: string | null
          pricing?: Json
          primary_species?: string[]
          published?: boolean
          raw_content?: Json | null
          season?: Json
          season_and_availability?: Json
          secondary_species?: string[]
          sections?: Json
          slug?: string
          source_active?: boolean
          source_id?: string
          source_url?: string
          starting_price?: number
          summary?: string
          terms?: Json
          territory?: Json | null
          title?: string
          travel?: Json
          trip_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_lodge_media: {
        Row: {
          alt: string
          caption: string | null
          created_at: string
          id: string
          last_checked_at: string | null
          last_downloaded_at: string | null
          lodge_record_id: string
          mirrored_url: string | null
          orphaned_at: string | null
          role: string
          sort_order: number
          source_hash: string | null
          source_url: string
          status: string
          updated_at: string
        }
        Insert: {
          alt: string
          caption?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_downloaded_at?: string | null
          lodge_record_id: string
          mirrored_url?: string | null
          orphaned_at?: string | null
          role?: string
          sort_order?: number
          source_hash?: string | null
          source_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          alt?: string
          caption?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_downloaded_at?: string | null
          lodge_record_id?: string
          mirrored_url?: string | null
          orphaned_at?: string | null
          role?: string
          sort_order?: number
          source_hash?: string | null
          source_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_lodge_media_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_lodge_media_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_lodges: {
        Row: {
          amenities: Json
          arrival: Json | null
          atmosphere_line: string | null
          capacity: Json
          central_moderation_status: string
          classification: string | null
          content_hash: string
          content_updated_at: string
          created_at: string
          dining: Json | null
          faqs: Json
          highlights: Json
          id: string
          last_seen_at: string | null
          location: Json
          lodge_id: string
          moderation_changed_at: string | null
          moderation_changed_by: string | null
          moderation_reason: string | null
          name: string
          orphaned_at: string | null
          publication_scope: string
          published: boolean
          raw_content: Json
          rooms: Json | null
          service: Json | null
          slug: string
          source_active: boolean
          source_id: string
          source_url: string
          standalone_page: boolean
          suitability: Json | null
          summary: string
          updated_at: string
        }
        Insert: {
          amenities?: Json
          arrival?: Json | null
          atmosphere_line?: string | null
          capacity?: Json
          central_moderation_status?: string
          classification?: string | null
          content_hash: string
          content_updated_at: string
          created_at?: string
          dining?: Json | null
          faqs?: Json
          highlights?: Json
          id?: string
          last_seen_at?: string | null
          location?: Json
          lodge_id: string
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          name: string
          orphaned_at?: string | null
          publication_scope?: string
          published?: boolean
          raw_content: Json
          rooms?: Json | null
          service?: Json | null
          slug: string
          source_active?: boolean
          source_id: string
          source_url: string
          standalone_page?: boolean
          suitability?: Json | null
          summary: string
          updated_at?: string
        }
        Update: {
          amenities?: Json
          arrival?: Json | null
          atmosphere_line?: string | null
          capacity?: Json
          central_moderation_status?: string
          classification?: string | null
          content_hash?: string
          content_updated_at?: string
          created_at?: string
          dining?: Json | null
          faqs?: Json
          highlights?: Json
          id?: string
          last_seen_at?: string | null
          location?: Json
          lodge_id?: string
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          name?: string
          orphaned_at?: string | null
          publication_scope?: string
          published?: boolean
          raw_content?: Json
          rooms?: Json | null
          service?: Json | null
          slug?: string
          source_active?: boolean
          source_id?: string
          source_url?: string
          standalone_page?: boolean
          suitability?: Json | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_lodges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_outfitters: {
        Row: {
          central_moderation_status: string
          content_hash: string
          content_updated_at: string
          countries: string[]
          created_at: string
          founded: number | null
          headquarters: string | null
          id: string
          inquiry: Json
          inquiry_url: string
          logo: Json
          moderation_changed_at: string | null
          moderation_changed_by: string | null
          moderation_reason: string | null
          name: string
          profile_image: Json
          profile_url: string
          public_contact: Json | null
          public_id: string
          published: boolean
          raw_content: Json | null
          regions: string[]
          social_urls: string[]
          source_id: string
          summary: string
          tagline: string
          updated_at: string
        }
        Insert: {
          central_moderation_status?: string
          content_hash: string
          content_updated_at: string
          countries?: string[]
          created_at?: string
          founded?: number | null
          headquarters?: string | null
          id?: string
          inquiry?: Json
          inquiry_url: string
          logo: Json
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          name: string
          profile_image: Json
          profile_url: string
          public_contact?: Json | null
          public_id: string
          published?: boolean
          raw_content?: Json | null
          regions?: string[]
          social_urls?: string[]
          source_id: string
          summary: string
          tagline: string
          updated_at?: string
        }
        Update: {
          central_moderation_status?: string
          content_hash?: string
          content_updated_at?: string
          countries?: string[]
          created_at?: string
          founded?: number | null
          headquarters?: string | null
          id?: string
          inquiry?: Json
          inquiry_url?: string
          logo?: Json
          moderation_changed_at?: string | null
          moderation_changed_by?: string | null
          moderation_reason?: string | null
          name?: string
          profile_image?: Json
          profile_url?: string
          public_contact?: Json | null
          public_id?: string
          published?: boolean
          raw_content?: Json | null
          regions?: string[]
          social_urls?: string[]
          source_id?: string
          summary?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_outfitters_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_publication_revisions: {
        Row: {
          accepted_at: string
          build_requested_at: string | null
          build_started_at: string | null
          build_status: string
          changed_source_ids: string[]
          created_at: string
          deployed_at: string | null
          deployment_id: string | null
          deployment_url: string | null
          error: string | null
          id: string
          revision_hash: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accepted_at?: string
          build_requested_at?: string | null
          build_started_at?: string | null
          build_status?: string
          changed_source_ids?: string[]
          created_at?: string
          deployed_at?: string | null
          deployment_id?: string | null
          deployment_url?: string | null
          error?: string | null
          id?: string
          revision_hash: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accepted_at?: string
          build_requested_at?: string | null
          build_started_at?: string | null
          build_status?: string
          changed_source_ids?: string[]
          created_at?: string
          deployed_at?: string | null
          deployment_id?: string | null
          deployment_url?: string | null
          error?: string | null
          id?: string
          revision_hash?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      marketplace_source_snapshots: {
        Row: {
          accepted: boolean
          content_hash: string
          fetched_at: string
          id: string
          payload: Json
          schema_version: string
          source_id: string
          validation_errors: Json | null
        }
        Insert: {
          accepted?: boolean
          content_hash: string
          fetched_at?: string
          id?: string
          payload: Json
          schema_version: string
          source_id: string
          validation_errors?: Json | null
        }
        Update: {
          accepted?: boolean
          content_hash?: string
          fetched_at?: string
          id?: string
          payload?: Json
          schema_version?: string
          source_id?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_source_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_sources: {
        Row: {
          consecutive_failures: number
          consent_confirmed_at: string | null
          consent_recorded_by: string | null
          content_feed_url: string
          created_at: string
          credential_rotated_at: string | null
          enabled: boolean
          feed_enabled: boolean
          feed_schema_version: string | null
          id: string
          language: string | null
          last_accepted_at: string | null
          last_accepted_content_hash: string | null
          last_feed_generated_at: string | null
          last_successful_sync_at: string | null
          last_sync_at: string | null
          last_sync_duration_ms: number | null
          last_sync_error: string | null
          last_sync_status: string | null
          last_webhook_at: string | null
          name: string
          participation_changed_at: string
          participation_reason: string | null
          participation_status: string
          source_id: string
          source_url: string | null
          updated_at: string
          webhook_secret_hash: string | null
          webhook_secret_hint: string | null
        }
        Insert: {
          consecutive_failures?: number
          consent_confirmed_at?: string | null
          consent_recorded_by?: string | null
          content_feed_url: string
          created_at?: string
          credential_rotated_at?: string | null
          enabled?: boolean
          feed_enabled?: boolean
          feed_schema_version?: string | null
          id?: string
          language?: string | null
          last_accepted_at?: string | null
          last_accepted_content_hash?: string | null
          last_feed_generated_at?: string | null
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          last_sync_duration_ms?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_webhook_at?: string | null
          name: string
          participation_changed_at?: string
          participation_reason?: string | null
          participation_status?: string
          source_id: string
          source_url?: string | null
          updated_at?: string
          webhook_secret_hash?: string | null
          webhook_secret_hint?: string | null
        }
        Update: {
          consecutive_failures?: number
          consent_confirmed_at?: string | null
          consent_recorded_by?: string | null
          content_feed_url?: string
          created_at?: string
          credential_rotated_at?: string | null
          enabled?: boolean
          feed_enabled?: boolean
          feed_schema_version?: string | null
          id?: string
          language?: string | null
          last_accepted_at?: string | null
          last_accepted_content_hash?: string | null
          last_feed_generated_at?: string | null
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          last_sync_duration_ms?: number | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_webhook_at?: string | null
          name?: string
          participation_changed_at?: string
          participation_reason?: string | null
          participation_status?: string
          source_id?: string
          source_url?: string | null
          updated_at?: string
          webhook_secret_hash?: string | null
          webhook_secret_hint?: string | null
        }
        Relationships: []
      }
      marketplace_sync_errors: {
        Row: {
          created_at: string
          details: Json | null
          error_code: string
          id: string
          message: string
          record_id: string | null
          record_type: string | null
          source_id: string | null
          sync_run_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          error_code: string
          id?: string
          message: string
          record_id?: string | null
          record_type?: string | null
          source_id?: string | null
          sync_run_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          error_code?: string
          id?: string
          message?: string
          record_id?: string | null
          record_type?: string | null
          source_id?: string | null
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sync_errors_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "marketplace_sync_errors_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sync_runs: {
        Row: {
          accepted_content_hash: string | null
          error: string | null
          feed_generated_at: string | null
          finished_at: string | null
          hunts_changed: number
          hunts_seen: number
          id: string
          lodges_changed: number
          lodges_seen: number
          media_changed: number
          publication_revision_id: string | null
          source_id: string | null
          started_at: string
          status: string
          trigger_type: string
          warning_count: number
        }
        Insert: {
          accepted_content_hash?: string | null
          error?: string | null
          feed_generated_at?: string | null
          finished_at?: string | null
          hunts_changed?: number
          hunts_seen?: number
          id?: string
          lodges_changed?: number
          lodges_seen?: number
          media_changed?: number
          publication_revision_id?: string | null
          source_id?: string | null
          started_at?: string
          status: string
          trigger_type?: string
          warning_count?: number
        }
        Update: {
          accepted_content_hash?: string | null
          error?: string | null
          feed_generated_at?: string | null
          finished_at?: string | null
          hunts_changed?: number
          hunts_seen?: number
          id?: string
          lodges_changed?: number
          lodges_seen?: number
          media_changed?: number
          publication_revision_id?: string | null
          source_id?: string | null
          started_at?: string
          status?: string
          trigger_type?: string
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sync_runs_publication_revision_id_fkey"
            columns: ["publication_revision_id"]
            isOneToOne: false
            referencedRelation: "marketplace_publication_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
    }
    Views: {
      marketplace_public_hunt_lodges: {
        Row: {
          hunt_id: string | null
          included_nights: number | null
          lodge_record_id: string | null
          region_key: string | null
          region_name: string | null
          sort_order: number | null
          summary: string | null
          transfer_notes: string | null
          usage: string | null
        }
        Insert: {
          hunt_id?: string | null
          included_nights?: number | null
          lodge_record_id?: string | null
          region_key?: string | null
          region_name?: string | null
          sort_order?: number | null
          summary?: string | null
          transfer_notes?: string | null
          usage?: string | null
        }
        Update: {
          hunt_id?: string | null
          included_nights?: number | null
          lodge_record_id?: string | null
          region_key?: string | null
          region_name?: string | null
          sort_order?: number | null
          summary?: string | null
          transfer_notes?: string | null
          usage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_lodges_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_lodges_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_public_hunt_media: {
        Row: {
          alt: string | null
          caption: string | null
          hunt_id: string | null
          id: string | null
          mirrored_url: string | null
          role: string | null
          sort_order: number | null
          source_url: string | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          hunt_id?: string | null
          id?: string | null
          mirrored_url?: string | null
          role?: string | null
          sort_order?: number | null
          source_url?: string | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          hunt_id?: string | null
          id?: string | null
          mirrored_url?: string | null
          role?: string | null
          sort_order?: number | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunt_media_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_hunts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_hunt_media_hunt_id_fkey"
            columns: ["hunt_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_hunts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_public_hunts: {
        Row: {
          accommodations: Json | null
          classification: Json | null
          content_updated_at: string | null
          destinations: Json | null
          currency: string | null
          duration: Json | null
          duration_and_party: Json | null
          editorial: Json | null
          equipment_and_licenses: Json | null
          exclusions: Json | null
          faqs: Json | null
          id: string | null
          inclusions: Json | null
          itinerary: Json | null
          listing_id: string | null
          methods_and_guiding: Json | null
          optional_services: Json | null
          outfitter_inquiry: Json | null
          outfitter_inquiry_url: string | null
          outfitter_name: string | null
          outfitter_profile_url: string | null
          pricing: Json | null
          primary_species: string[] | null
          season: Json | null
          season_and_availability: Json | null
          secondary_species: string[] | null
          sections: Json | null
          slug: string | null
          source_id: string | null
          source_url: string | null
          starting_price: number | null
          summary: string | null
          terms: Json | null
          territory: Json | null
          title: string | null
          travel: Json | null
          trip_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_hunts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_public_lodge_media: {
        Row: {
          alt: string | null
          caption: string | null
          id: string | null
          lodge_record_id: string | null
          mirrored_url: string | null
          role: string | null
          sort_order: number | null
          source_url: string | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          id?: string | null
          lodge_record_id?: string | null
          mirrored_url?: string | null
          role?: string | null
          sort_order?: number | null
          source_url?: string | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          id?: string | null
          lodge_record_id?: string | null
          mirrored_url?: string | null
          role?: string | null
          sort_order?: number | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_lodge_media_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_lodges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_lodge_media_lodge_record_id_fkey"
            columns: ["lodge_record_id"]
            isOneToOne: false
            referencedRelation: "marketplace_public_lodges"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_public_lodges: {
        Row: {
          amenities: Json | null
          arrival: Json | null
          atmosphere_line: string | null
          capacity: Json | null
          classification: string | null
          content_updated_at: string | null
          dining: Json | null
          faqs: Json | null
          highlights: Json | null
          id: string | null
          location: Json | null
          lodge_id: string | null
          name: string | null
          outfitter_name: string | null
          outfitter_profile_url: string | null
          publication_scope: string | null
          rooms: Json | null
          service: Json | null
          slug: string | null
          source_id: string | null
          source_url: string | null
          standalone_page: boolean | null
          suitability: Json | null
          summary: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_lodges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      marketplace_public_outfitters: {
        Row: {
          content_updated_at: string | null
          countries: string[] | null
          founded: number | null
          headquarters: string | null
          id: string | null
          inquiry: Json | null
          inquiry_url: string | null
          logo: Json | null
          name: string | null
          profile_image: Json | null
          profile_url: string | null
          public_contact: Json | null
          public_id: string | null
          regions: string[] | null
          social_urls: string[] | null
          source_id: string | null
          summary: string | null
          tagline: string | null
        }
        Insert: {
          content_updated_at?: string | null
          countries?: string[] | null
          founded?: number | null
          headquarters?: string | null
          id?: string | null
          inquiry?: Json | null
          inquiry_url?: string | null
          logo?: Json | null
          name?: string | null
          profile_image?: Json | null
          profile_url?: string | null
          public_contact?: Json | null
          public_id?: string | null
          regions?: string[] | null
          social_urls?: string[] | null
          source_id?: string | null
          summary?: string | null
          tagline?: string | null
        }
        Update: {
          content_updated_at?: string | null
          countries?: string[] | null
          founded?: number | null
          headquarters?: string | null
          id?: string | null
          inquiry?: Json | null
          inquiry_url?: string | null
          logo?: Json | null
          name?: string | null
          profile_image?: Json | null
          profile_url?: string | null
          public_contact?: Json | null
          public_id?: string | null
          regions?: string[] | null
          social_urls?: string[] | null
          source_id?: string | null
          summary?: string | null
          tagline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_outfitters_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "marketplace_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
    }
    Functions: {
      marketplace_claim_publication_build: {
        Args: { minimum_age_seconds?: number; stale_after_minutes?: number }
        Returns: {
          revision_hash: string
          revision_id: string
        }[]
      }
      marketplace_fail_publication_build: {
        Args: { failure_message: string; target_revision_id: string }
        Returns: undefined
      }
      marketplace_get_public_catalog: { Args: never; Returns: Json }
      marketplace_get_public_revision: { Args: never; Returns: Json }
      marketplace_refresh_publication_for_source: {
        Args: { target_source_id: string }
        Returns: undefined
      }
      marketplace_source_is_public: {
        Args: { target_source_id: string }
        Returns: boolean
      }
      marketplace_verify_publication_build: {
        Args: {
          target_deployment_id: string
          target_deployment_url: string
          target_revision_hash: string
          target_revision_id: string
        }
        Returns: boolean
      }
      set_marketplace_source_moderation: {
        Args: {
          new_status: string
          reason?: string
          recorded_by: string
          target_source_id: string
        }
        Returns: {
          changed_at: string
          hunts_changed: number
          lodges_changed: number
          moderation_status: string
          outfitters_changed: number
          source_id: string
        }[]
      }
      set_marketplace_source_participation: {
        Args: {
          new_status: string
          reason?: string
          recorded_by: string
          target_source_id: string
        }
        Returns: {
          consecutive_failures: number
          consent_confirmed_at: string | null
          consent_recorded_by: string | null
          content_feed_url: string
          created_at: string
          credential_rotated_at: string | null
          enabled: boolean
          feed_enabled: boolean
          feed_schema_version: string | null
          id: string
          language: string | null
          last_accepted_at: string | null
          last_accepted_content_hash: string | null
          last_feed_generated_at: string | null
          last_successful_sync_at: string | null
          last_sync_at: string | null
          last_sync_duration_ms: number | null
          last_sync_error: string | null
          last_sync_status: string | null
          last_webhook_at: string | null
          name: string
          participation_changed_at: string
          participation_reason: string | null
          participation_status: string
          source_id: string
          source_url: string | null
          updated_at: string
          webhook_secret_hash: string | null
          webhook_secret_hint: string | null
        }
        SetofOptions: {
          from: "*"
          to: "marketplace_sources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
