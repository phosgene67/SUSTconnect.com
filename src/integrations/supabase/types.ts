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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: Database["public"]["Enums"]["announcement_priority"] | null
          target_type: Database["public"]["Enums"]["announcement_target"] | null
          target_value: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          target_type?:
            | Database["public"]["Enums"]["announcement_target"]
            | null
          target_value?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          target_type?:
            | Database["public"]["Enums"]["announcement_target"]
            | null
          target_value?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          downvotes: number | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      korum_members: {
        Row: {
          id: string
          joined_at: string | null
          korum_id: string
          role: Database["public"]["Enums"]["korum_member_role"] | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          korum_id: string
          role?: Database["public"]["Enums"]["korum_member_role"] | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          korum_id?: string
          role?: Database["public"]["Enums"]["korum_member_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "korum_members_korum_id_fkey"
            columns: ["korum_id"]
            isOneToOne: false
            referencedRelation: "korums"
            referencedColumns: ["id"]
          },
        ]
      }
      korum_pinned_messages: {
        Row: {
          id: string
          korum_id: string
          message_id: string
          pinned_at: string | null
          pinned_by: string
        }
        Insert: {
          id?: string
          korum_id: string
          message_id: string
          pinned_at?: string | null
          pinned_by: string
        }
        Update: {
          id?: string
          korum_id?: string
          message_id?: string
          pinned_at?: string | null
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "korum_pinned_messages_korum_id_fkey"
            columns: ["korum_id"]
            isOneToOne: false
            referencedRelation: "korums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "korum_pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      korums: {
        Row: {
          admin_only_posting: boolean | null
          allow_member_messages: boolean | null
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          type: Database["public"]["Enums"]["korum_type"]
          updated_at: string | null
        }
        Insert: {
          admin_only_posting?: boolean | null
          allow_member_messages?: boolean | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          type?: Database["public"]["Enums"]["korum_type"]
          updated_at?: string | null
        }
        Update: {
          admin_only_posting?: boolean | null
          allow_member_messages?: boolean | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          type?: Database["public"]["Enums"]["korum_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          korum_id: string | null
          receiver_id: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          korum_id?: string | null
          receiver_id?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          korum_id?: string | null
          receiver_id?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_korum_id_fkey"
            columns: ["korum_id"]
            isOneToOne: false
            referencedRelation: "korums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link_url: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["post_category"]
          comment_count: number | null
          content: string
          created_at: string | null
          downvotes: number | null
          id: string
          korum_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["post_category"]
          comment_count?: number | null
          content: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          korum_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["post_category"]
          comment_count?: number | null
          content?: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          korum_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_korum_id_fkey"
            columns: ["korum_id"]
            isOneToOne: false
            referencedRelation: "korums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          batch: string
          bio: string | null
          created_at: string
          department: string
          full_name: string
          id: string
          skills: string[] | null
          social_github: string | null
          social_linkedin: string | null
          social_portfolio: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          batch: string
          bio?: string | null
          created_at?: string
          department: string
          full_name: string
          id?: string
          skills?: string[] | null
          social_github?: string | null
          social_linkedin?: string | null
          social_portfolio?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          batch?: string
          bio?: string | null
          created_at?: string
          department?: string
          full_name?: string
          id?: string
          skills?: string[] | null
          social_github?: string | null
          social_linkedin?: string | null
          social_portfolio?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          created_at: string | null
          description: string | null
          github_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          project_url: string | null
          technologies: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_url?: string | null
          technologies?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_url?: string | null
          technologies?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_research: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          publication_url: string | null
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          publication_url?: string | null
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          publication_url?: string | null
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_vote: {
        Args: {
          target_id: string
          target_type: string
          value: number
        }
        Returns: {
          upvotes: number
          downvotes: number
          user_vote: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_comment_count: {
        Args: { post_id: string }
        Returns: void
      }
    }
    Enums: {
      announcement_priority: "normal" | "important" | "urgent"
      announcement_target: "university" | "department" | "batch" | "korum"
      app_role: "student" | "teacher" | "admin"
      korum_member_role: "admin" | "moderator" | "member"
      korum_type: "batch" | "department" | "project" | "club" | "course"
      notification_type:
        | "message"
        | "comment"
        | "reply"
        | "mention"
        | "announcement"
        | "korum_invite"
        | "upvote"
      post_category:
        | "academic_help"
        | "project"
        | "notice"
        | "question"
        | "resource"
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
      announcement_priority: ["normal", "important", "urgent"],
      announcement_target: ["university", "department", "batch", "korum"],
      app_role: ["student", "teacher", "admin"],
      korum_member_role: ["admin", "moderator", "member"],
      korum_type: ["batch", "department", "project", "club", "course"],
      notification_type: [
        "message",
        "comment",
        "reply",
        "mention",
        "announcement",
        "korum_invite",
        "upvote",
      ],
      post_category: [
        "academic_help",
        "project",
        "notice",
        "question",
        "resource",
      ],
    },
  },
} as const
