'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calculator, FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Company, VatReturn } from '@/types/database'

interface VatSummary {
  outputVat: number
  inputVat: number
  netVat: number
  standardRatedSupplies: number
  zeroRatedSupplies: number
  standardRatedExpenses: number
  invoiceCount: number
  billCount: number
  expenseCount: number
}

interface VatDashboardContentProps {
  companyId: string
  company: Company | null
  vatSummary: VatSummary | null
  vatReturns: VatReturn[]
}

export function VatDashboardContent({ companyId, company, vatSummary, vatReturns }: VatDashboardContentProps) {
  const [showFileDialog, setShowFileDialog] = React.useState(false)
  const [selectedReturn, setSelectedReturn] = React.useState<VatReturn | null>(null)
  const [filingReference, setFilingReference] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  // Get current quarter dates
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
  const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  const quarterLabel = `Q${quarter + 1} ${now.getFullYear()}`
  
  const handleFileReturn = async () => {
    if (!selectedReturn || !filingReference) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vat/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vat_return_id: selectedReturn.id,
          filing_reference: filingReference,
        }),
      })
      
      if (response.ok) {
        setShowFileDialog(false)
        setSelectedReturn(null)
        setFilingReference('')
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to file return:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">VAT Management</h1>
          <p className="text-muted-foreground">
            UAE VAT returns and compliance (Form 201)
          </p>
        </div>
        {company?.vat_registered && (
          <Badge variant="outline" className="text-sm">
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            VAT Registered
          </Badge>
        )}
      </div>
      
      {/* VAT Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Output VAT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(vatSummary?.outputVat || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              VAT collected from sales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Input VAT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(vatSummary?.inputVat || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              VAT paid on purchases
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Net VAT Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(vatSummary?.netVat || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(vatSummary?.netVat || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(vatSummary?.netVat || 0) >= 0 ? 'Payable to FTA' : 'Refundable from FTA'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quarterLabel}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(quarterStart, 'dd MMM')} - {format(quarterEnd, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Period</TabsTrigger>
          <TabsTrigger value="form201">Form 201 Preview</TabsTrigger>
          <TabsTrigger value="history">VAT Returns History</TabsTrigger>
        </TabsList>
        
        {/* Current Period Tab */}
        <TabsContent value="current">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales (Output VAT)</CardTitle>
                <CardDescription>
                  {vatSummary?.invoiceCount || 0} invoices in current period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard Rated Supplies (5%)</span>
                  <span className="font-medium">{formatCurrency(vatSummary?.standardRatedSupplies || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zero Rated Supplies</span>
                  <span className="font-medium">{formatCurrency(vatSummary?.zeroRatedSupplies || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Output VAT (Box 1)</span>
                  <span className="font-bold text-green-600">{formatCurrency(vatSummary?.outputVat || 0)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Purchases (Input VAT)</CardTitle>
                <CardDescription>
                  {vatSummary?.billCount || 0} bills, {vatSummary?.expenseCount || 0} expenses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard Rated Purchases</span>
                  <span className="font-medium">{formatCurrency(vatSummary?.standardRatedExpenses || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reverse Charge Purchases</span>
                  <span className="font-medium">{formatCurrency(0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Input VAT (Box 6)</span>
                  <span className="font-bold text-red-600">{formatCurrency(vatSummary?.inputVat || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Form 201 Preview Tab */}
        <TabsContent value="form201">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                VAT Return Form 201 Preview
              </CardTitle>
              <CardDescription>
                Period: {format(quarterStart, 'dd MMM yyyy')} - {format(quarterEnd, 'dd MMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sales Section */}
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Sales (Output VAT)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Box</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Value (AED)</TableHead>
                        <TableHead className="text-right">VAT (AED)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono bg-muted">1</TableCell>
                        <TableCell>Standard Rated Supplies</TableCell>
                        <TableCell className="text-right">{formatCurrency(vatSummary?.standardRatedSupplies || 0)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(vatSummary?.outputVat || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono bg-muted">4</TableCell>
                        <TableCell>Zero Rated Supplies</TableCell>
                        <TableCell className="text-right">{formatCurrency(vatSummary?.zeroRatedSupplies || 0)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono bg-muted">5</TableCell>
                        <TableCell>Exempt Supplies</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Purchases Section */}
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Purchases (Input VAT)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Box</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Value (AED)</TableHead>
                        <TableHead className="text-right">VAT (AED)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono bg-muted">6</TableCell>
                        <TableCell>Standard Rated Expenses</TableCell>
                        <TableCell className="text-right">{formatCurrency(vatSummary?.standardRatedExpenses || 0)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(vatSummary?.inputVat || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono bg-muted">7</TableCell>
                        <TableCell>Reverse Charge Expenses</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Net VAT */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 text-lg">Net VAT Due</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono bg-background">9</TableCell>
                        <TableCell className="font-medium">
                          {(vatSummary?.netVat || 0) >= 0 ? 'Net VAT Payable' : 'Net VAT Refundable'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-lg font-bold ${(vatSummary?.netVat || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(vatSummary?.netVat || 0))}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end gap-4">
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                  <Button>
                    Prepare for Filing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>VAT Return History</CardTitle>
              <CardDescription>
                Previously filed and draft VAT returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vatReturns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No VAT returns yet</h3>
                  <p className="text-muted-foreground">
                    File your first VAT return from the Form 201 Preview tab
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Output VAT</TableHead>
                      <TableHead className="text-right">Input VAT</TableHead>
                      <TableHead className="text-right">Net VAT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Filed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vatReturns.map((vatReturn) => (
                      <TableRow key={vatReturn.id}>
                        <TableCell className="font-medium">
                          {format(new Date(vatReturn.period_start), 'MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(vatReturn.vat_collected)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(vatReturn.vat_paid)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${vatReturn.box9_net_vat_due >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(vatReturn.box9_net_vat_due))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={vatReturn.status === 'filed' ? 'default' : 'secondary'}>
                            {vatReturn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {vatReturn.filed_at ? format(new Date(vatReturn.filed_at), 'dd MMM yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* File Return Dialog */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark VAT Return as Filed</DialogTitle>
            <DialogDescription>
              Enter the FTA filing reference number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReturn && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">
                    {format(new Date(selectedReturn.period_start), 'MMM yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net VAT Due</span>
                  <span className="font-bold">
                    {formatCurrency(Math.abs(selectedReturn.box9_net_vat_due))}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>FTA Filing Reference *</Label>
              <Input 
                placeholder="e.g., VAT-2024-Q1-123456"
                value={filingReference}
                onChange={(e) => setFilingReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileReturn} disabled={isSubmitting || !filingReference}>
              {isSubmitting ? 'Filing...' : 'Mark as Filed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
