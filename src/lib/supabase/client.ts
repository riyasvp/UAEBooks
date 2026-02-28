import { createBrowserClient } from '@supabase/ssr'
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

export function createClient() {
  const config = getSupabaseConfig()
  
  return createBrowserClient<Database>(
    config.url,
    config.key
  )
}

// Singleton instance
let client: ReturnType<typeof createClient> | undefined

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}

// Check if Supabase is properly configured
export function isSupabaseReady(): boolean {
  const config = getSupabaseConfig()
  return config.isConfigured
}

export default getSupabaseClient
