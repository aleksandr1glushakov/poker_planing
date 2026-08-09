import { describe, expect, it } from 'vitest'

import { parseSupabaseConfig, SupabaseConfigurationError } from './config'

describe('parseSupabaseConfig', () => {
  it('returns a valid public Supabase configuration', () => {
    expect(
      parseSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    })
  })

  it('rejects missing values and secret keys', () => {
    expect(() => parseSupabaseConfig({})).toThrow(SupabaseConfigurationError)
    expect(() =>
      parseSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: ['sb', 'secret', 'do-not-use'].join('_'),
      }),
    ).toThrow(SupabaseConfigurationError)
  })
})
