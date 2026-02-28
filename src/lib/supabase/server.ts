import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Placeholder values for when env vars are not set
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTI1NDM2MDAsImV4cCI6MTkyODExOTYwMH0.placeholder'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if URL is valid
  const isValidUrl = url && 
    url !== 'your-supabase-project-url' && 
    (url.startsWith('http://') || url.startsWith('https://'))
  
  // Check if key is valid
  const isValidKey = key && 
    key !== 'your-supabase-anon-key' &&
    key.length > 20
  
  return {
    url: isValidUrl ? url! : PLACEHOLDER_URL,
    key: isValidKey ? key! : PLACEHOLDER_KEY,
    isConfigured: isValidUrl && isValidKey
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()

  return createServerClient<Database>(
    config.url,
    config.key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Admin client with service role (for background jobs, webhooks)
export async function createAdminClient() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER_KEY

  return createServerClient<Database>(
    config.url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
