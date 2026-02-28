import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getDashboardStats } from '@/lib/db/queries'

// Demo dashboard stats
function getDemoDashboardStats() {
  return {
    revenue: 16500000,
    expenses: 16485000,
    netProfit: 15000,
    overdueReceivables: 3675000,
    overduePayables: 525000,
    overdueInvoicesCount: 1,
    cashBalance: 25000000,
    contactsCount: 7,
    accountsCount: 26,
    monthlyData: [
      { month: 'Aug', revenue: 12000000, expenses: 9500000 },
      { month: 'Sep', revenue: 14500000, expenses: 11200000 },
      { month: 'Oct', revenue: 13200000, expenses: 10800000 },
      { month: 'Nov', revenue: 15800000, expenses: 12500000 },
      { month: 'Dec', revenue: 18500000, expenses: 14200000 },
      { month: 'Jan', revenue: 16500000, expenses: 16485000 },
    ],
    topExpenses: [
      { category: 'Professional Fees', amount: 2000000 },
      { category: 'Utilities', amount: 1500000 },
      { category: 'Salaries & Wages', amount: 12800000 },
    ],
    recentActivity: [
      { type: 'invoice', id: 'inv-004', number: 'INV-2024-004', amount: 9975000, date: '2024-02-01', contact: 'Dubai Properties LLC', status: 'partial' },
      { type: 'invoice', id: 'inv-003', number: 'INV-2024-003', amount: 3675000, date: '2024-01-25', contact: 'Emirates Airlines', status: 'overdue' },
      { type: 'invoice', id: 'inv-002', number: 'INV-2024-002', amount: 8400000, date: '2024-01-20', contact: 'Abu Dhabi National Oil Co.', status: 'sent' },
      { type: 'bill', id: 'bill-002', number: 'BILL-2024-002', amount: 1575000, date: '2024-01-15', contact: 'Amazon AWS ME', status: 'approved' },
      { type: 'invoice', id: 'inv-001', number: 'INV-2024-001', amount: 5250000, date: '2024-01-15', contact: 'Dubai Properties LLC', status: 'paid' },
      { type: 'bill', id: 'bill-001', number: 'BILL-2024-001', amount: 2100000, date: '2024-01-10', contact: 'Microsoft Gulf', status: 'paid' },
    ],
    overdueInvoicesList: [
      { id: 'inv-003', number: 'INV-2024-003', amount: 3675000, contact: 'Emirates Airlines', dueDate: '2024-02-24' },
    ],
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json(getDemoDashboardStats())
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
    
    // Get dashboard stats
    const stats = await getDashboardStats(companyId)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
