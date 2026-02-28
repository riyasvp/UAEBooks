import { NextRequest, NextResponse } from 'next/server'
import { DEMO_VAT_RETURNS, DEMO_COMPANY } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getVatReturns, calculateVatSummary, getCompanyById } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      // Calculate current quarter dates
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const periodStart = new Date(now.getFullYear(), quarter * 3, 1)
      const periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      
      return NextResponse.json({ 
        vatReturns: DEMO_VAT_RETURNS,
        company: DEMO_COMPANY,
        vatSummary: {
          outputVat: 650000,
          inputVat: 200000,
          netVat: 450000,
          standardRatedSupplies: 13000000,
          zeroRatedSupplies: 0,
          standardRatedExpenses: 4000000,
          invoiceCount: 4,
          billCount: 3,
          expenseCount: 0,
        }
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
    
    // Get VAT data
    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3)
    const periodStart = new Date(now.getFullYear(), quarter * 3, 1)
    const periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
    
    const [company, vatReturns, vatSummary] = await Promise.all([
      getCompanyById(companyId),
      getVatReturns(companyId),
      calculateVatSummary(
        companyId,
        periodStart.toISOString().split('T')[0],
        periodEnd.toISOString().split('T')[0]
      )
    ])
    
    return NextResponse.json({ vatReturns, company, vatSummary })
  } catch (error) {
    console.error('Error fetching VAT:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VAT data' },
      { status: 500 }
    )
  }
}
