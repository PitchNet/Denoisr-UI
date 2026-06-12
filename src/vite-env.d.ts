/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_FETCH_BATCH_SIZE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
