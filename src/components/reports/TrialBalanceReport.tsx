'use client'

import { filsToAED } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, FileText, Scale, CheckCircle2, AlertCircle } from 'lucide-react'

interface TrialBalanceItem {
  code: string
  account: string
  type: string
  debit: number
  credit: number
}

interface TrialBalanceData {
  items: TrialBalanceItem[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

interface TrialBalanceReportProps {
  data: TrialBalanceData
  asOfDate: string
  company: { name: string }
}

export function TrialBalanceReport({ data, asOfDate, company }: TrialBalanceReportProps) {
  const handleExportPDF = async () => {
    alert('PDF export coming soon!')
  }

  const handleExportExcel = async () => {
    alert('Excel export coming soon!')
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-blue-600'
      case 'liability': return 'text-red-600'
      case 'equity': return 'text-green-600'
      case 'revenue': return 'text-emerald-600'
      case 'expense': return 'text-orange-600'
      case 'cogs': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trial Balance</h1>
          <p className="text-muted-foreground">
            As of {new Date(asOfDate).toLocaleDateString('en-AE', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filsToAED(data.totalDebit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filsToAED(data.totalCredit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Check */}
      {data.isBalanced ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-3">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <strong>Balanced:</strong> Debits equal Credits ({filsToAED(data.totalDebit)})
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Out of Balance:</strong> Difference of {filsToAED(Math.abs(data.totalDebit - data.totalCredit))}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <p className="text-sm text-muted-foreground">Trial Balance</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No accounts with balances found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.account}</TableCell>
                        <TableCell>
                          <span className={`text-xs capitalize ${getAccountTypeColor(item.type)}`}>
                            {item.type.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.debit > 0 ? filsToAED(item.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.credit > 0 ? filsToAED(item.credit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell className="text-right font-mono">{filsToAED(data.totalDebit)}</TableCell>
                      <TableCell className="text-right font-mono">{filsToAED(data.totalCredit)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
