export interface Database {
  public: {
    Tables: {
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
          mediaType: string | null
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
        }
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
      }
    }
  }
}

export type Comment = Database['public']['Tables']['comments']['Row'];
export type GeminiComment = Database['public']['Tables']['gemini_comments']['Row'];
export type GptComment = Database['public']['Tables']['gpt_comments']['Row'];
export type ClaudeComment = Database['public']['Tables']['claude_comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
