import { NextRequest, NextResponse } from 'next/server'
import { DEMO_BILLS, DEMO_CONTACTS, DEMO_PRODUCTS } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getBills, getContacts, getProducts } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json({ 
        bills: DEMO_BILLS,
        suppliers: DEMO_CONTACTS.filter(c => c.type === 'supplier' || c.type === 'both'),
        products: DEMO_PRODUCTS
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
    
    // Get bills, suppliers, and products
    const [bills, suppliers, products] = await Promise.all([
      getBills(companyId),
      getContacts(companyId, 'supplier'),
      getProducts(companyId)
    ])
    
    return NextResponse.json({ bills, suppliers, products })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}
