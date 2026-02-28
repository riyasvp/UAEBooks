import { NextRequest, NextResponse } from 'next/server'
import { DEMO_INVOICES, DEMO_CONTACTS } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getInvoices, getContacts } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json({ 
        invoices: DEMO_INVOICES,
        contacts: DEMO_CONTACTS.filter(c => c.type === 'customer' || c.type === 'both')
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
    
    // Get invoices and contacts
    const [invoices, contacts] = await Promise.all([
      getInvoices(companyId),
      getContacts(companyId, 'customer')
    ])
    
    return NextResponse.json({ invoices, contacts })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
