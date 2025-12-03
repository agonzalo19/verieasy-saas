/// <reference types="vite/client" />

// Este archivo le dice a TypeScript que las variables de entorno VITE_ existen.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Asegúrate de añadir aquí cualquier otra variable VITE_ que utilices
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}