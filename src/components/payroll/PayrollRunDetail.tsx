'use client'

import Link from 'next/link'
import { filsToAED, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, FileSpreadsheet, Users, Calendar, DollarSign } from 'lucide-react'
import type { PayrollRun, PayrollItem, Employee } from '@/types/database'

interface PayrollRunDetailProps {
  run: PayrollRun & { items: (PayrollItem & { employee: Employee })[] }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function PayrollRunDetail({ run }: PayrollRunDetailProps) {
  const getStatusBadge = (status: PayrollRun['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-blue-500">Approved</Badge>
      case 'processed':
        return <Badge variant="default" className="bg-green-500">Processed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totals = run.items.reduce((acc, item) => ({
    basic: acc.basic + item.basic_salary,
    housing: acc.housing + item.housing_allowance,
    transport: acc.transport + item.transport_allowance,
    other: acc.other + item.other_allowances,
    overtime: acc.overtime + item.overtime_amount,
    leave: acc.leave + item.leave_salary,
    deductions: acc.deductions + item.deductions,
    net: acc.net + item.net_salary,
  }), { basic: 0, housing: 0, transport: 0, other: 0, overtime: 0, leave: 0, deductions: 0, net: 0 })

  // Check WPS readiness
  const wpsReady = run.items.every(item => {
    const emp = item.employee
    if (!emp) return false
    return emp.labour_card_no && emp.iban && emp.bank_routing_code
  })
  const wpsIssues = run.items.filter(item => {
    const emp = item.employee
    if (!emp) return true
    return !emp.labour_card_no || !emp.iban || !emp.bank_routing_code
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/payroll/runs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Payroll - {MONTHS[run.run_month - 1]} {run.run_year}
            </h1>
            <p className="text-muted-foreground">
              Created on {formatDate(run.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(run.status)}
          {run.status === 'processed' && (
            <Button variant="outline" asChild>
              <Link href={`/api/payroll/runs/${run.id}/wps`} download>
                <Download className="mr-2 h-4 w-4" />
                Export WPS SIF
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.total_employees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filsToAED(totals.basic + totals.housing + totals.transport + totals.other + totals.overtime + totals.leave)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ({filsToAED(totals.deductions)})
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filsToAED(run.total_amount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WPS Status */}
      {run.status === 'processed' && (
        <Card className={wpsReady ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className={`h-5 w-5 ${wpsReady ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <p className={`font-medium ${wpsReady ? 'text-green-800' : 'text-yellow-800'}`}>
                  {wpsReady ? 'WPS Ready' : 'WPS Issues Found'}
                </p>
                {wpsIssues.length > 0 && (
                  <p className="text-sm text-yellow-700">
                    {wpsIssues.length} employee(s) missing Labour Card, IBAN, or Routing Code
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Housing</TableHead>
                  <TableHead className="text-right">Transport</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Leave</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right font-bold">Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.items.map((item) => {
                  const emp = item.employee
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{emp?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            {emp?.employee_code || 'N/A'} • {item.days_paid} days
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
                      <TableCell className="text-right font-mono text-sm">
                        {item.overtime_hours > 0 ? `${item.overtime_hours}h / ${filsToAED(item.overtime_amount)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.leave_salary > 0 ? filsToAED(item.leave_salary) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {item.deductions > 0 ? `(${filsToAED(item.deductions)})` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {filsToAED(item.net_salary)}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.basic)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.housing)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.transport)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.other)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.overtime)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(totals.leave)}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    ({filsToAED(totals.deductions)})
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {filsToAED(totals.net)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Processing Info */}
      {run.status === 'processed' && run.processed_at && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Processed on {formatDate(run.processed_at, 'long')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
