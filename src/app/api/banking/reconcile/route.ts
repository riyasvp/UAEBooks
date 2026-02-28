import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Reconcile bank transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { transaction_id } = body
    
    if (!transaction_id) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }
    
    // Get the transaction to verify access
    const { data: transaction, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('*, bank_accounts!inner(company_id)')
      .eq('id', transaction_id)
      .single()
    
    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    // Verify user has access to this company
    const companyId = transaction.bank_accounts?.company_id || transaction.company_id
    const { data: userCompany } = await supabase
      .from('users_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single()
    
    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Mark as reconciled
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
      })
      .eq('id', transaction_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reconcile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
