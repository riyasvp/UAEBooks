import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Mark VAT return as filed
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { vat_return_id, filing_reference } = body
    
    if (!vat_return_id || !filing_reference) {
      return NextResponse.json({ error: 'VAT return ID and filing reference required' }, { status: 400 })
    }
    
    // Get the VAT return to verify access
    const { data: vatReturn, error: fetchError } = await supabase
      .from('vat_returns')
      .select('*')
      .eq('id', vat_return_id)
      .single()
    
    if (fetchError || !vatReturn) {
      return NextResponse.json({ error: 'VAT return not found' }, { status: 404 })
    }
    
    // Verify user has access to this company
    const { data: userCompany } = await supabase
      .from('users_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', vatReturn.company_id)
      .single()
    
    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Update VAT return status
    const { error } = await supabase
      .from('vat_returns')
      .update({
        status: 'filed',
        filed_at: new Date().toISOString(),
        filing_reference,
      })
      .eq('id', vat_return_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('File VAT return error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
