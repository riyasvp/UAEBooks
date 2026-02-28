'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { filsToAED, aedToFils } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPayrollRunAction } from '@/actions/index'
import { ArrowLeft, Save, Calculator, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Employee } from '@/types/database'

interface PayrollRunFormProps {
  employees: Employee[]
  companyId: string
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface PayrollItemInput {
  employee_id: string
  employee: Employee
  basic_salary: number
  housing_allowance: number
  transport_allowance: number
  other_allowances: number
  overtime_hours: number
  overtime_amount: number
  leave_salary: number
  deductions: number
  net_salary: number
  days_paid: number
}

export function PayrollRunForm({ employees, companyId }: PayrollRunFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Filter active employees only
  const activeEmployees = employees.filter(e => e.status === 'active')

  const [payrollItems, setPayrollItems] = useState<PayrollItemInput[]>(() => 
    activeEmployees.map(emp => ({
      employee_id: emp.id,
      employee: emp,
      basic_salary: emp.basic_salary,
      housing_allowance: emp.housing_allowance,
      transport_allowance: emp.transport_allowance,
      other_allowances: emp.other_allowances,
      overtime_hours: 0,
      overtime_amount: 0,
      leave_salary: 0,
      deductions: 0,
      net_salary: emp.basic_salary + emp.housing_allowance + emp.transport_allowance + emp.other_allowances,
      days_paid: 30,
    }))
  )

  // Calculate net salary when inputs change
  useEffect(() => {
    setPayrollItems(items => 
      items.map(item => ({
        ...item,
        net_salary: item.basic_salary + item.housing_allowance + item.transport_allowance + 
                    item.other_allowances + item.overtime_amount + item.leave_salary - item.deductions
      }))
    )
  }, [payrollItems.map(i => 
    `${i.basic_salary}-${i.housing_allowance}-${i.transport_allowance}-${i.other_allowances}-${i.overtime_amount}-${i.leave_salary}-${i.deductions}`
  ).join(',')])

  const updateItem = (index: number, field: keyof PayrollItemInput, value: number) => {
    setPayrollItems(items => {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Auto-calculate overtime amount (simplified: 1 hour = basic_salary / 240)
      if (field === 'overtime_hours') {
        const hourlyRate = newItems[index].basic_salary / 240 // 30 days * 8 hours
        newItems[index].overtime_amount = Math.round(value * hourlyRate * 1.25) // 1.25x for OT
      }
      
      // Recalculate net salary
      const item = newItems[index]
      item.net_salary = item.basic_salary + item.housing_allowance + item.transport_allowance + 
                        item.other_allowances + item.overtime_amount + item.leave_salary - item.deductions
      
      return newItems
    })
  }

  const totals = payrollItems.reduce((acc, item) => ({
    basic: acc.basic + item.basic_salary,
    housing: acc.housing + item.housing_allowance,
    transport: acc.transport + item.transport_allowance,
    other: acc.other + item.other_allowances,
    overtime: acc.overtime + item.overtime_amount,
    leave: acc.leave + item.leave_salary,
    deductions: acc.deductions + item.deductions,
    net: acc.net + item.net_salary,
  }), { basic: 0, housing: 0, transport: 0, other: 0, overtime: 0, leave: 0, deductions: 0, net: 0 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (payrollItems.length === 0) {
        throw new Error('No active employees to process payroll for')
      }

      const result = await createPayrollRunAction(companyId, {
        run_month: selectedMonth,
        run_year: selectedYear,
        items: payrollItems.map(item => ({
          employee_id: item.employee_id,
          basic_salary: item.basic_salary,
          housing_allowance: item.housing_allowance,
          transport_allowance: item.transport_allowance,
          other_allowances: item.other_allowances,
          overtime_hours: item.overtime_hours,
          overtime_amount: item.overtime_amount,
          leave_salary: item.leave_salary,
          deductions: item.deductions,
          net_salary: item.net_salary,
          days_paid: item.days_paid,
        }))
      })

      if (result.error) {
        throw new Error(result.error)
      }

      router.push('/dashboard/payroll/runs')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/payroll/runs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Run Payroll</h1>
            <p className="text-muted-foreground">
              Create a new payroll run for your employees
            </p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Creating...' : 'Create Payroll Run'}
        </Button>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => setSelectedMonth(Number(value))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {activeEmployees.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No active employees found.</p>
            <p className="text-sm mt-1">Add employees before running payroll.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/payroll/employees">Add Employees</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payroll Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Salary Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                {activeEmployees.length} active employee(s)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Employee</TableHead>
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">Housing</TableHead>
                      <TableHead className="text-right">Transport</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">OT Hours</TableHead>
                      <TableHead className="text-right">OT Amount</TableHead>
                      <TableHead className="text-right">Leave Salary</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right font-bold">Net Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item, index) => (
                      <TableRow key={item.employee_id}>
                        <TableCell className="sticky left-0 bg-background">
                          <div>
                            <div className="font-medium">{item.employee.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.employee.employee_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {filsToAED(item.basic_salary)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {filsToAED(item.housing_allowance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {filsToAED(item.transport_allowance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {filsToAED(item.other_allowances)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.overtime_hours}
                            onChange={(e) => updateItem(index, 'overtime_hours', Number(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            step={0.5}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {filsToAED(item.overtime_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.leave_salary / 100}
                            onChange={(e) => updateItem(index, 'leave_salary', aedToFils(Number(e.target.value)))}
                            className="w-24 text-right"
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.deductions / 100}
                            onChange={(e) => updateItem(index, 'deductions', aedToFils(Number(e.target.value)))}
                            className="w-24 text-right"
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono">
                          {filsToAED(item.net_salary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Basic</p>
                  <p className="text-lg font-medium">{filsToAED(totals.basic)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Allowances</p>
                  <p className="text-lg font-medium">
                    {filsToAED(totals.housing + totals.transport + totals.other)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Overtime</p>
                  <p className="text-lg font-medium">{filsToAED(totals.overtime)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-lg font-medium text-red-600">
                    ({filsToAED(totals.deductions)})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Payable</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filsToAED(totals.net)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </form>
  )
}
