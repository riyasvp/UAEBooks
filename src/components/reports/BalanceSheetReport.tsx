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
import { FileSpreadsheet, FileText, Scale, Building2, Coins } from 'lucide-react'

interface BalanceSheetData {
  assets: {
    current: { account: string; code: string; subType: string; amount: number }[]
    fixed: { account: string; code: string; subType: string; amount: number }[]
    all: { account: string; code: string; subType: string; amount: number }[]
    total: number
  }
  liabilities: {
    current: { account: string; code: string; subType: string; amount: number }[]
    longTerm: { account: string; code: string; subType: string; amount: number }[]
    all: { account: string; code: string; subType: string; amount: number }[]
    total: number
  }
  equity: {
    all: { account: string; code: string; subType: string; amount: number }[]
    total: number
  }
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

interface BalanceSheetReportProps {
  data: BalanceSheetData
  asOfDate: string
  company: { name: string }
}

export function BalanceSheetReport({ data, asOfDate, company }: BalanceSheetReportProps) {
  const handleExportPDF = async () => {
    alert('PDF export coming soon!')
  }

  const handleExportExcel = async () => {
    alert('Excel export coming soon!')
  }

  const renderSection = (
    title: string,
    items: { account: string; code: string; subType: string; amount: number }[],
    total: number,
    indent?: boolean
  ) => (
    <>
      <TableRow className="bg-muted/30">
        <TableCell colSpan={2} className={`font-semibold ${indent ? 'pl-6' : ''}`}>{title}</TableCell>
      </TableRow>
      {items.map((item, idx) => (
        <TableRow key={idx}>
          <TableCell className={indent ? 'pl-10' : ''}>
            <span className="text-muted-foreground mr-2">{item.code}</span>
            {item.account}
          </TableCell>
          <TableCell className="text-right font-mono">{filsToAED(item.amount)}</TableCell>
        </TableRow>
      ))}
      <TableRow className="font-medium bg-muted/50">
        <TableCell className={indent ? 'pl-6' : ''}>Total {title}</TableCell>
        <TableCell className="text-right font-mono">{filsToAED(total)}</TableCell>
      </TableRow>
    </>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
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
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filsToAED(data.assets.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <Scale className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{filsToAED(data.liabilities.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filsToAED(data.equity.total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Check */}
      {!data.isBalanced && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <strong>Warning:</strong> Balance sheet is not balanced. 
              Assets: {filsToAED(data.assets.total)} ≠ 
              Liabilities + Equity: {filsToAED(data.totalLiabilitiesAndEquity)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Report - Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ASSETS</span>
              <Badge variant="outline">{filsToAED(data.assets.total)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assets.current.length > 0 && renderSection('Current Assets', data.assets.current, 
                  data.assets.current.reduce((s, i) => s + i.amount, 0), true)}
                {data.assets.fixed.length > 0 && renderSection('Fixed Assets', data.assets.fixed, 
                  data.assets.fixed.reduce((s, i) => s + i.amount, 0), true)}
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell>TOTAL ASSETS</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(data.assets.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>LIABILITIES & EQUITY</span>
              <Badge variant="outline">{filsToAED(data.totalLiabilitiesAndEquity)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.liabilities.current.length > 0 && renderSection('Current Liabilities', data.liabilities.current, 
                  data.liabilities.current.reduce((s, i) => s + i.amount, 0), true)}
                {data.liabilities.longTerm.length > 0 && renderSection('Long-term Liabilities', data.liabilities.longTerm, 
                  data.liabilities.longTerm.reduce((s, i) => s + i.amount, 0), true)}
                <TableRow className="font-medium bg-muted/50">
                  <TableCell>Total Liabilities</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(data.liabilities.total)}</TableCell>
                </TableRow>
                
                <TableRow><TableCell colSpan={2} className="h-4" /></TableRow>
                
                {data.equity.all.length > 0 && renderSection('Equity', data.equity.all, data.equity.total, true)}
                
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(data.totalLiabilitiesAndEquity)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
