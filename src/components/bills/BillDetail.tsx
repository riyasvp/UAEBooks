'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, DollarSign, Download, MoreHorizontal, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createPaymentAction } from '@/actions'
import type { Bill } from '@/types/database'

interface BillDetailProps {
  bill: Bill
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  awaiting_approval: 'bg-orange-100 text-orange-800',
  approved: 'bg-blue-100 text-blue-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function BillDetail({ bill }: BillDetailProps) {
  const router = useRouter()
  const [showPaymentDialog, setShowPaymentDialog] = React.useState(false)
  const [paymentAmount, setPaymentAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('bank_transfer')
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const contact = bill.contact as any
  const items = bill.items || []
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  }
  
  const balanceDue = bill.total - (bill.amount_paid || 0)
  
  // Generate PDF
  const generatePDF = () => {
    window.open(`/api/bills/${bill.id}/pdf`, '_blank')
  }
  
  const handlePayment = async () => {
    const amount = Math.round(parseFloat(paymentAmount) * 100)
    if (amount <= 0 || amount > balanceDue) return
    
    setIsProcessing(true)
    try {
      await createPaymentAction({
        company_id: bill.company_id,
        contact_id: bill.contact_id,
        bill_id: bill.id,
        amount,
        payment_method: paymentMethod,
      })
      setShowPaymentDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to record payment:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/bills')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{bill.bill_number}</h1>
              <Badge className={statusColors[bill.status]}>
                {bill.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {bill.bill_date} • Due: {bill.due_date}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {bill.status !== 'paid' && bill.status !== 'cancelled' && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <p className="font-medium">{contact?.name || 'Unknown'}</p>
                {contact?.address && <p className="text-sm text-muted-foreground">{contact.address}</p>}
                {contact?.trn && <p className="text-sm text-muted-foreground">TRN: {contact.trn}</p>}
              </div>
            </CardContent>
          </Card>
          
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{item.vat_rate / 100}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Notes */}
          {bill.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{bill.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (5%)</span>
                <span>{formatCurrency(bill.vat_total)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(bill.total)}</span>
              </div>
              
              {bill.amount_paid > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(bill.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Balance Due</span>
                    <span className={cn(balanceDue > 0 && 'text-red-600')}>
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for bill {bill.bill_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (AED)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={(balanceDue / 100).toFixed(2)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Balance due: {formatCurrency(balanceDue)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
