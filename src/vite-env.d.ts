/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUBSPOT_FORM_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
