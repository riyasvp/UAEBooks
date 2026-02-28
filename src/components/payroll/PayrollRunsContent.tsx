'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { approvePayrollRunAction, processPayrollRunAction } from '@/actions/index'
import { Plus, Calendar, DollarSign, Users, CheckCircle, Clock, PlayCircle, Download } from 'lucide-react'
import type { PayrollRun, PayrollItem, Employee } from '@/types/database'

type PayrollRunWithItems = PayrollRun & {
  items: (PayrollItem & { employee: Employee })[]
}

interface PayrollRunsContentProps {
  payrollRuns: PayrollRunWithItems[]
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

export function PayrollRunsContent({ payrollRuns, companyId }: PayrollRunsContentProps) {
  const router = useRouter()
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const filteredRuns = payrollRuns.filter(run => 
    yearFilter === 'all' || run.run_year === Number(yearFilter)
  )

  // Stats
  const stats = {
    total: payrollRuns.length,
    draft: payrollRuns.filter(r => r.status === 'draft').length,
    approved: payrollRuns.filter(r => r.status === 'approved').length,
    processed: payrollRuns.filter(r => r.status === 'processed').length,
    totalAmount: payrollRuns.filter(r => r.status === 'processed').reduce((sum, r) => sum + r.total_amount, 0),
  }

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

  const handleApprove = async (runId: string) => {
    if (!confirm('Are you sure you want to approve this payroll run?')) return
    const result = await approvePayrollRunAction(runId, companyId)
    if (result.error) {
      alert(result.error)
      return
    }
    router.refresh()
  }

  const handleProcess = async (runId: string) => {
    if (!confirm('Are you sure you want to process this payroll run? This will create journal entries and cannot be undone.')) return
    setProcessing(runId)
    try {
      const result = await processPayrollRunAction(runId, companyId)
      if (result.error) {
        alert(result.error)
        return
      }
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const getMonthName = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || ''
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filsToAED(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button asChild>
          <Link href="/dashboard/payroll/runs/new">
            <Plus className="mr-2 h-4 w-4" />
            Run Payroll
          </Link>
        </Button>
      </div>

      {/* Payroll Runs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No payroll runs found. Run your first payroll to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link 
                      href={`/dashboard/payroll/runs/${run.id}`}
                      className="font-medium hover:underline"
                    >
                      {getMonthName(run.run_month)} {run.run_year}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {run.total_employees}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {filsToAED(run.total_amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell>{formatDate(run.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {run.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(run.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {run.status === 'approved' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProcess(run.id)}
                          disabled={processing === run.id}
                        >
                          {processing === run.id ? 'Processing...' : 'Process'}
                        </Button>
                      )}
                      {run.status === 'processed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/api/payroll/runs/${run.id}/wps`}>
                            <Download className="mr-2 h-4 w-4" />
                            WPS Export
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/payroll/runs/${run.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
