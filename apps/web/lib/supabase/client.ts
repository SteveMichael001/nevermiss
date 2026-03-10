import { createBrowserClient } from '@supabase/ssr'
import { getRequiredEnv } from '@/lib/env'

export function createClient() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'supabase/client')
  const supabaseAnonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'supabase/client')

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('[supabase/client] Missing Supabase browser env vars')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
