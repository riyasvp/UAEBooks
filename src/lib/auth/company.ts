'use server'

import { createClient } from '@/lib/supabase/server'
import type { Company } from '@/types/database'

export async function getUserCompanies(): Promise<(Company & { role: string })[]> {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return []
  }
  
  const { data, error } = await supabase
    .from('users_companies')
    .select(`
      role,
      company:companies(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
  
  if (error || !data) {
    return []
  }
  
  return data
    .filter((item): item is { role: string; company: Company } => item.company !== null)
    .map(item => ({
      ...item.company,
      role: item.role
    }))
}

export async function getActiveCompanyId(): Promise<string | null> {
  const companies = await getUserCompanies()
  return companies[0]?.id || null
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

export async function getUserProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    // Return basic profile from auth user
    return {
      user_id: user.id,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      email: user.email,
    }
  }
  
  return {
    ...data,
    email: user.email,
  }
}
