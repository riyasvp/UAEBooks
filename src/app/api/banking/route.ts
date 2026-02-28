import { NextRequest, NextResponse } from 'next/server'
import { DEMO_BANK_ACCOUNTS, DEMO_COMPANY } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getBankAccounts } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json({ 
        bankAccounts: DEMO_BANK_ACCOUNTS,
        company: DEMO_COMPANY
      })
    }
    
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get company ID
    const companyId = await getActiveCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }
    
    // Get bank accounts
    const bankAccounts = await getBankAccounts(companyId)
    
    return NextResponse.json({ bankAccounts, company: null })
  } catch (error) {
    console.error('Error fetching banking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banking data' },
      { status: 500 }
    )
  }
}
