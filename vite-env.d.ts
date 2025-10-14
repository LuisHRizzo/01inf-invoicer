/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // Añade aquí cualquier otra variable de entorno que uses, por ejemplo:
  // readonly VITE_ANALYTICS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}