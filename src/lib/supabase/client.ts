import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { parseSupabaseConfig } from './config'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client
  }

  const config = parseSupabaseConfig(import.meta.env)
  client = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  return client
}
