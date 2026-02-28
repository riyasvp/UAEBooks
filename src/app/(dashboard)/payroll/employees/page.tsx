import { getActiveCompanyId } from '@/lib/auth/company'
import { getAllEmployees } from '@/lib/db/queries'
import { EmployeesPageContent } from '@/components/payroll/EmployeesPageContent'

export default async function EmployeesPage() {
  const companyId = await getActiveCompanyId()
  
  const employees = companyId ? await getAllEmployees(companyId) : []
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-muted-foreground">
          Manage your employees and their salary details
        </p>
      </div>
      
      <EmployeesPageContent 
        employees={employees}
        companyId={companyId || ''}
      />
    </div>
  )
}
