'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatIBAN } from '@/lib/utils'
import type { BankAccount, BankTransaction, Payment } from '@/types/database'

interface BankAccountDetailProps {
  account: BankAccount
  payments: Payment[]
}

const transactionTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  deposit: { label: 'Deposit', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-green-600' },
  withdrawal: { label: 'Withdrawal', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-red-600' },
  transfer_in: { label: 'Transfer In', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-green-600' },
  transfer_out: { label: 'Transfer Out', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-red-600' },
}

export function BankAccountDetail({ account, payments }: BankAccountDetailProps) {
  const router = useRouter()
  const [showTransactionDialog, setShowTransactionDialog] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null)
  
  // Form state
  const [transactionType, setTransactionType] = React.useState<'deposit' | 'withdrawal'>('deposit')
  const [transactionDate, setTransactionDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
  const [description, setDescription] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [reference, setReference] = React.useState('')
  
  const transactions = (account.transactions || []) as BankTransaction[]
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: account.currency,
      minimumFractionDigits: 2,
    }).format(value / 100)
  }
  
  // Group transactions by reconciled status
  const unreconciledTransactions = transactions.filter(t => !t.is_reconciled)
  const reconciledTransactions = transactions.filter(t => t.is_reconciled)
  
  // Stats
  const totalDeposits = transactions
    .filter(t => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalWithdrawals = transactions
    .filter(t => t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer_out')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const handleAddTransaction = async () => {
    if (!description || !amount) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/banking/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: account.company_id,
          bank_account_id: account.id,
          transaction_date: transactionDate,
          description,
          amount: Math.round(parseFloat(amount) * 100),
          transaction_type: transactionType,
          reference: reference || null,
        }),
      })
      
      if (response.ok) {
        router.refresh()
        setShowTransactionDialog(false)
        // Reset form
        setDescription('')
        setAmount('')
        setReference('')
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleReconcile = async (transactionId: string) => {
    setReconcilingId(transactionId)
    try {
      const response = await fetch('/api/banking/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId }),
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to reconcile:', error)
    } finally {
      setReconcilingId(null)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/banking')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{account.bank_name}</h1>
            </div>
            <p className="text-muted-foreground">
              {account.account_name} • {account.iban ? formatIBAN(account.iban) : account.account_number}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowTransactionDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${account.current_balance < 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(account.current_balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(totalDeposits)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(totalWithdrawals)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unreconciled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unreconciledTransactions.length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="unreconciled">
            Unreconciled ({unreconciledTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="payments">Linked Payments ({payments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const typeInfo = transactionTypeLabels[transaction.transaction_type]
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.transaction_date}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${typeInfo.color}`}>
                            {(transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in') ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.balance ? formatCurrency(transaction.balance) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.is_reconciled ? 'default' : 'secondary'}>
                              {transaction.is_reconciled ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Reconciled</>
                              ) : (
                                <><Clock className="mr-1 h-3 w-3" /> Pending</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!transaction.is_reconciled && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReconcile(transaction.id)}
                                disabled={reconcilingId === transaction.id}
                              >
                                {reconcilingId === transaction.id ? 'Processing...' : 'Reconcile'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unreconciled">
          <Card>
            <CardContent className="pt-6">
              {unreconciledTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium">All reconciled!</h3>
                  <p className="text-muted-foreground">All transactions have been reconciled</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledTransactions.map((transaction) => {
                      const typeInfo = transactionTypeLabels[transaction.transaction_type]
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.transaction_date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${typeInfo.color}`}>
                            {(transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in') ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => handleReconcile(transaction.id)}
                              disabled={reconcilingId === transaction.id}
                            >
                              {reconcilingId === transaction.id ? 'Processing...' : 'Reconcile'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No linked payments yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.payment_number}</TableCell>
                        <TableCell>{payment.payment_date}</TableCell>
                        <TableCell>{(payment.contact as any)?.name || '-'}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
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
      
      {/* Add Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Transaction</DialogTitle>
            <DialogDescription>
              Record a manual transaction for this account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'deposit' | 'withdrawal')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      Deposit (Money In)
                    </div>
                  </SelectItem>
                  <SelectItem value="withdrawal">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                      Withdrawal (Money Out)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea 
                placeholder="Transaction description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount ({account.currency}) *</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input 
                placeholder="e.g., Cheque #, Ref #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction} disabled={isSubmitting || !description || !amount}>
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
