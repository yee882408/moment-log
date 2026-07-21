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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      concert_record_tags: {
        Row: {
          record_id: string
          tag_id: string
        }
        Insert: {
          record_id: string
          tag_id: string
        }
        Update: {
          record_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concert_record_tags_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_record_tags_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records_with_like_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_record_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_records: {
        Row: {
          artist: string
          cover_image_url: string | null
          created_at: string
          date: string
          id: string
          is_public: boolean
          rating: number | null
          review: string | null
          search_vector: unknown
          spotify_playlist_id: string | null
          template_id: string | null
          ticket_price: number | null
          title: string
          user_id: string
          venue_lat: number | null
          venue_lng: number | null
          venue_name: string
        }
        Insert: {
          artist: string
          cover_image_url?: string | null
          created_at?: string
          date: string
          id?: string
          is_public?: boolean
          rating?: number | null
          review?: string | null
          search_vector?: unknown
          spotify_playlist_id?: string | null
          template_id?: string | null
          ticket_price?: number | null
          title: string
          user_id: string
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name: string
        }
        Update: {
          artist?: string
          cover_image_url?: string | null
          created_at?: string
          date?: string
          id?: string
          is_public?: boolean
          rating?: number | null
          review?: string | null
          search_vector?: unknown
          spotify_playlist_id?: string | null
          template_id?: string | null
          ticket_price?: number | null
          title?: string
          user_id?: string
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "concert_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concerts: {
        Row: {
          artist: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          title: string
          venue_lat: number
          venue_lng: number
          venue_name: string
        }
        Insert: {
          artist: string
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          title: string
          venue_lat: number
          venue_lng: number
          venue_name: string
        }
        Update: {
          artist?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          title?: string
          venue_lat?: number
          venue_lng?: number
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "concerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          record_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          record_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          record_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "record_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records_with_like_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          is_banned: boolean
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          is_banned?: boolean
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_banned?: boolean
          role?: string
        }
        Relationships: []
      }
      record_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          record_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          record_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_comments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_comments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records_with_like_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      record_likes: {
        Row: {
          created_at: string
          id: string
          record_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          record_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_likes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_likes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "concert_records_with_like_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_routes: {
        Row: {
          created_at: string
          id: string
          start_lat: number
          start_lng: number
          start_point_label: string
          user_id: string
          venue_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          start_lat: number
          start_lng: number
          start_point_label: string
          user_id: string
          venue_name: string
        }
        Update: {
          created_at?: string
          id?: string
          start_lat?: number
          start_lng?: number
          start_point_label?: string
          user_id?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_list_items: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          list_id: string
          place_lat: number
          place_lng: number
          place_name: string
          place_type: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          list_id: string
          place_lat: number
          place_lng: number
          place_name: string
          place_type?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          list_id?: string
          place_lat?: number
          place_lng?: number
          place_name?: string
          place_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spot_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "spot_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "spot_lists_with_item_count"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_list_likes: {
        Row: {
          created_at: string
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_list_likes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "spot_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_list_likes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "spot_lists_with_item_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_list_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_lists: {
        Row: {
          artist: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          user_id: string
        }
        Insert: {
          artist: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          user_id: string
        }
        Update: {
          artist?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      concert_records_with_like_count: {
        Row: {
          artist: string | null
          comment_count: number | null
          cover_image_url: string | null
          created_at: string | null
          date: string | null
          date_text: string | null
          id: string | null
          is_public: boolean | null
          like_count: number | null
          rating: number | null
          review: string | null
          spotify_playlist_id: string | null
          template_id: string | null
          ticket_price: number | null
          title: string | null
          user_id: string | null
          venue_lat: number | null
          venue_lng: number | null
          venue_name: string | null
        }
        Insert: {
          artist?: string | null
          comment_count?: never
          cover_image_url?: string | null
          created_at?: string | null
          date?: string | null
          date_text?: never
          id?: string | null
          is_public?: boolean | null
          like_count?: never
          rating?: number | null
          review?: string | null
          spotify_playlist_id?: string | null
          template_id?: string | null
          ticket_price?: number | null
          title?: string | null
          user_id?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
        }
        Update: {
          artist?: string | null
          comment_count?: never
          cover_image_url?: string | null
          created_at?: string | null
          date?: string | null
          date_text?: never
          id?: string | null
          is_public?: boolean | null
          like_count?: never
          rating?: number | null
          review?: string | null
          spotify_playlist_id?: string | null
          template_id?: string | null
          ticket_price?: number | null
          title?: string | null
          user_id?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concert_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_lists_with_item_count: {
        Row: {
          artist: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          item_count: number | null
          like_count: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          item_count?: never
          like_count?: never
          title?: string | null
          user_id?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          item_count?: never
          like_count?: never
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spot_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_banned: boolean
          role: string
        }[]
      }
      admin_set_user_banned: {
        Args: { banned: boolean; target_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { new_role: string; target_id: string }
        Returns: undefined
      }
      get_monthly_record_counts: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_current_user_banned: { Args: never; Returns: boolean }
      record_is_public: { Args: { p_record_id: string }; Returns: boolean }
      search_concert_records: {
        Args: {
          p_keyword: string
          p_limit?: number
          p_offset?: number
          p_public_only?: boolean
          p_tag_ids?: string[]
          p_user_id?: string
        }
        Returns: {
          id: string
          rank: number
        }[]
      }
      search_concert_records_count: {
        Args: {
          p_keyword: string
          p_public_only?: boolean
          p_tag_ids?: string[]
          p_user_id?: string
        }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      spot_list_is_visible: { Args: { p_list_id: string }; Returns: boolean }
    }
    Enums: {
      notification_type: "follow" | "comment" | "like"
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
  public: {
    Enums: {
      notification_type: ["follow", "comment", "like"],
    },
  },
} as const
