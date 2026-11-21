/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BIXS_API_BASE?: string
  readonly VITE_BIXS_EMAIL?: string
  readonly VITE_BIXS_PASSWORD?: string
  readonly VITE_BIXS_API_KEY?: string
  readonly VITE_NOMELIMPO_PLAN_ID?: string
  readonly VITE_NOMELIMPO_APP_SOURCE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
