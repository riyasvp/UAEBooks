import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List bank accounts
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's companies
    const { data: userCompanies } = await supabase
      .from('users_companies')
      .select('company_id')
      .eq('user_id', user.id)
    
    const companyIds = userCompanies?.map(uc => uc.company_id) || []
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .in('company_id', companyIds)
      .eq('is_active', true)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Banking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create bank account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { company_id, bank_name, account_name, account_number, iban, currency, opening_balance } = body
    
    // Verify user has access to this company
    const { data: userCompany } = await supabase
      .from('users_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()
    
    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        company_id,
        bank_name,
        account_name,
        account_number,
        iban: iban || null,
        currency: currency || 'AED',
        opening_balance: opening_balance || 0,
        current_balance: opening_balance || 0,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create bank account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
