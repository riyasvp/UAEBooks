import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Create bank transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      company_id, 
      bank_account_id, 
      transaction_date, 
      description, 
      amount, 
      transaction_type, 
      reference 
    } = body
    
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
    
    // Create transaction
    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        company_id,
        bank_account_id,
        transaction_date,
        description,
        amount,
        transaction_type,
        reference: reference || null,
        is_reconciled: false,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Update bank account balance
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', bank_account_id)
      .single()
    
    if (account) {
      const adjustment = transaction_type === 'deposit' || transaction_type === 'transfer_in'
        ? amount
        : -amount
      
      await supabase
        .from('bank_accounts')
        .update({ current_balance: account.current_balance + adjustment })
        .eq('id', bank_account_id)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
