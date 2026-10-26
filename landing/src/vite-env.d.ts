/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BIXS_API_BASE?: string
  readonly VITE_BIXS_EMAIL?: string
  readonly VITE_BIXS_PASSWORD?: string
  readonly VITE_BIXS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
