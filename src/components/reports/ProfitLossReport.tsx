'use client'

import { useState } from 'react'
import { filsToAED } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, FileSpreadsheet, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface ProfitLossData {
  revenue: { account: string; code: string; amount: number }[]
  totalRevenue: number
  cogs: { account: string; code: string; amount: number }[]
  totalCogs: number
  grossProfit: number
  expenses: { account: string; code: string; amount: number }[]
  totalExpenses: number
  otherIncome: { account: string; code: string; amount: number }[]
  totalOtherIncome: number
  netProfit: number
}

interface ProfitLossReportProps {
  data: ProfitLossData
  startDate: string
  endDate: string
  company: { name: string }
}

export function ProfitLossReport({ data, startDate, endDate, company }: ProfitLossReportProps) {
  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!')
  }

  const handleExportExcel = async () => {
    // TODO: Implement Excel export
    alert('Excel export coming soon!')
  }

  const formatPeriod = () => {
    const start = new Date(startDate).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })
    const end = new Date(endDate).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })
    return start === end ? start : `${start} - ${end}`
  }

  const renderSection = (
    title: string,
    items: { account: string; code: string; amount: number }[],
    total: number,
    isTotal?: boolean
  ) => (
    <>
      <TableRow className="bg-muted/30">
        <TableCell colSpan={2} className="font-semibold">{title}</TableCell>
      </TableRow>
      {items.map((item, idx) => (
        <TableRow key={idx}>
          <TableCell>
            <span className="text-muted-foreground mr-2">{item.code}</span>
            {item.account}
          </TableCell>
          <TableCell className="text-right font-mono">{filsToAED(item.amount)}</TableCell>
        </TableRow>
      ))}
      <TableRow className={isTotal ? "bg-primary/10 font-bold" : "font-medium bg-muted/50"}>
        <TableCell>Total {title}</TableCell>
        <TableCell className="text-right font-mono">{filsToAED(total)}</TableCell>
      </TableRow>
    </>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">{formatPeriod()}</p>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filsToAED(data.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filsToAED(data.grossProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalRevenue > 0 ? ((data.grossProfit / data.totalRevenue) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">({filsToAED(data.totalExpenses)})</div>
          </CardContent>
        </Card>
        <Card className={data.netProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className={`h-4 w-4 ${data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {filsToAED(data.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <p className="text-sm text-muted-foreground">Profit & Loss Statement</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount (AED)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              {renderSection('Revenue', data.revenue, data.totalRevenue)}
              
              {/* COGS Section */}
              {data.cogs.length > 0 && (
                <>
                  <TableRow><TableCell colSpan={2} className="h-4" /></TableRow>
                  {renderSection('Cost of Goods Sold', data.cogs, data.totalCogs)}
                </>
              )}
              
              {/* Gross Profit */}
              <TableRow className="bg-blue-50 font-bold text-blue-700">
                <TableCell>GROSS PROFIT</TableCell>
                <TableCell className="text-right font-mono">{filsToAED(data.grossProfit)}</TableCell>
              </TableRow>
              
              {/* Expenses Section */}
              {data.expenses.length > 0 && (
                <>
                  <TableRow><TableCell colSpan={2} className="h-4" /></TableRow>
                  {renderSection('Operating Expenses', data.expenses, data.totalExpenses)}
                </>
              )}
              
              {/* Other Income */}
              {data.otherIncome.length > 0 && (
                <>
                  <TableRow><TableCell colSpan={2} className="h-4" /></TableRow>
                  {renderSection('Other Income', data.otherIncome, data.totalOtherIncome)}
                </>
              )}
              
              {/* Net Profit */}
              <TableRow className="bg-primary/10 font-bold text-lg">
                <TableCell>NET PROFIT / (LOSS)</TableCell>
                <TableCell className={`text-right font-mono ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {filsToAED(data.netProfit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
