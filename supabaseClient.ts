// Archivo: supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Importante: Vite requiere el prefijo VITE_ para exponer las variables de entorno al cliente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificación de seguridad
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están definidas en el archivo .env.local.')
}

// Crea y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)