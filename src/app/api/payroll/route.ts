import { NextRequest, NextResponse } from 'next/server'
import { DEMO_EMPLOYEES, DEMO_PAYROLL_RUNS } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/server'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getEmployees, getPayrollRuns } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Check for demo mode
    const demoMode = request.headers.get('x-demo-mode') === 'true' || 
                     request.cookies.get('uae-books-demo-mode')?.value === 'true'
    
    if (demoMode) {
      return NextResponse.json({ 
        employees: DEMO_EMPLOYEES,
        payrollRuns: DEMO_PAYROLL_RUNS
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
    
    // Get employees and payroll runs
    const [employees, payrollRuns] = await Promise.all([
      getAllEmployees(companyId),
      getPayrollRuns(companyId)
    ])
    
    return NextResponse.json({ employees, payrollRuns })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll data' },
      { status: 500 }
    )
  }
}

async function getAllEmployees(companyId: string) {
  const { getEmployees } = await import('@/lib/db/queries')
  return getEmployees(companyId)
}
