import { NextRequest, NextResponse } from 'next/server'
import { DEMO_PRODUCTS, DEMO_COMPANY } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getProducts, getStockValuation, getStockMovements } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json({ 
        products: DEMO_PRODUCTS,
        company: DEMO_COMPANY,
        stockValuation: {
          items: DEMO_PRODUCTS.filter(p => p.track_inventory).map(p => ({
            product_id: p.id,
            sku: p.sku,
            name: p.name,
            stock_on_hand: p.stock_on_hand,
            unit_cost: p.cost_price,
            total_value: p.stock_on_hand * p.cost_price,
            reorder_level: p.reorder_level,
            needs_reorder: p.stock_on_hand <= p.reorder_level,
          })),
          totalValue: DEMO_PRODUCTS.filter(p => p.track_inventory).reduce((sum, p) => sum + p.stock_on_hand * p.cost_price, 0),
          itemCount: DEMO_PRODUCTS.filter(p => p.track_inventory).length,
          lowStockCount: DEMO_PRODUCTS.filter(p => p.track_inventory && p.stock_on_hand <= p.reorder_level).length,
        },
        movements: []
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
    
    // Get inventory data
    const [products, stockValuation, movements] = await Promise.all([
      getProducts(companyId),
      getStockValuation(companyId),
      getStockMovements(companyId)
    ])
    
    return NextResponse.json({ products, stockValuation, movements, company: null })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    )
  }
}
