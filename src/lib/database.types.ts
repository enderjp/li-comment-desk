export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string | null
        }
        Insert: {
          id: string
          role?: string | null
        }
        Update: {
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      customer_service_agents: {
        Row: {
          id: string
          agent_name: string
        }
        Insert: {
          id?: string
          agent_name: string
        }
        Update: {
          id?: string
          agent_name?: string
        }
        Relationships: []
      }
      media_buyer: {
        Row: {
          id: string
          media_buyer_name: string
        }
        Insert: {
          id?: string
          media_buyer_name: string
        }
        Update: {
          id?: string
          media_buyer_name?: string
        }
        Relationships: []
      }
      vertical: {
        Row: {
          id: string
          vertical_name: string
        }
        Insert: {
          id?: string
          vertical_name: string
        }
        Update: {
          id?: string
          vertical_name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: number
          request_id: number
          created_at: string
          media_buyer: string | null
          agente_customer_service: string | null
          vertical: string | null
          url: string | null
          script: string | null
          Comentarios: string | null
          adset: string | null
          language: string | null
          script_updated_at: string | null
          thumbnail_urls: string[] | string | null
          visibility: string | null
          media_type: string | null
        }
        Insert: {
          id?: number
          request_id: number
          created_at?: string
          media_buyer?: string | null
          agente_customer_service?: string | null
          vertical?: string | null
          url?: string | null
          script?: string | null
          Comentarios?: string | null
          adset?: string | null
          language?: string | null
          script_updated_at?: string | null
          thumbnail_urls?: string[] | string | null
          visibility?: string | null
          media_type?: string | null
        }
        Update: {
          id?: number
          request_id?: number
          created_at?: string
          media_buyer?: string | null
          agente_customer_service?: string | null
          vertical?: string | null
          url?: string | null
          script?: string | null
          Comentarios?: string | null
          adset?: string | null
          language?: string | null
          script_updated_at?: string | null
          thumbnail_urls?: string[] | string | null
          visibility?: string | null
          media_type?: string | null
        }
        Relationships: []
      }
      gemini_comments: {
        Row: {
          id: number
          created_at: string
          comment_request_id: number
          comment_content: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          comment_request_id: number
          comment_content?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          comment_request_id?: number
          comment_content?: string | null
        }
        Relationships: []
      }
      gpt_comments: {
        Row: {
          id: number
          created_at: string
          comment_request_id: number
          comment_content: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          comment_request_id: number
          comment_content?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          comment_request_id?: number
          comment_content?: string | null
        }
        Relationships: []
      }
      claude_comments: {
        Row: {
          id: number
          created_at: string
          comment_request_id: number
          comment_content: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          comment_request_id: number
          comment_content?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          comment_request_id?: number
          comment_content?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          request_id: number | null
          adset: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          request_id?: number | null
          adset?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          request_id?: number | null
          adset?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Comment = Database['public']['Tables']['comments']['Row'];
export type GeminiComment = Database['public']['Tables']['gemini_comments']['Row'];
export type GptComment = Database['public']['Tables']['gpt_comments']['Row'];
export type ClaudeComment = Database['public']['Tables']['claude_comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
