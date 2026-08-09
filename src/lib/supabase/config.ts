import { z } from 'zod'

const supabaseConfigSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_'),
})

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

export class SupabaseConfigurationError extends Error {
  constructor() {
    super('Supabase is not configured. Add the project URL and publishable key.')
    this.name = 'SupabaseConfigurationError'
  }
}

export function parseSupabaseConfig(
  environment: Record<string, unknown>,
): SupabaseConfig {
  const result = supabaseConfigSchema.safeParse(environment)

  if (!result.success) {
    throw new SupabaseConfigurationError()
  }

  return {
    url: result.data.VITE_SUPABASE_URL,
    publishableKey: result.data.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
}
