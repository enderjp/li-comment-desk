/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_N8N_WEBHOOK_URLS_DATA: string;
  readonly VITE_N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS: string;
  readonly VITE_N8N_WEBHOOK_UPDATE_GPT_COMMENTS: string;
  readonly VITE_N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS: string;
  readonly VITE_N8N_WEBHOOK_UPDATE_SCRIPT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
