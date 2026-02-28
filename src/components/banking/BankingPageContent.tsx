'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatIBAN } from '@/lib/utils'
import type { BankAccount } from '@/types/database'

interface BankingPageContentProps {
  initialAccounts: BankAccount[]
  companyId: string
}

export function BankingPageContent({ initialAccounts, companyId }: BankingPageContentProps) {
  const router = useRouter()
  const [accounts, setAccounts] = React.useState(initialAccounts)
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Form state
  const [bankName, setBankName] = React.useState('')
  const [accountName, setAccountName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [iban, setIban] = React.useState('')
  const [openingBalance, setOpeningBalance] = React.useState('')
  const [currency, setCurrency] = React.useState('AED')
  
  const formatCurrency = (value: number, curr: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(value / 100)
  }
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)
  
  const handleAddAccount = async () => {
    if (!bankName || !accountName || !accountNumber) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          iban: iban || null,
          currency,
          opening_balance: Math.round(parseFloat(openingBalance || '0') * 100),
          current_balance: Math.round(parseFloat(openingBalance || '0') * 100),
          is_active: true,
        }),
      })
      
      if (response.ok) {
        const newAccount = await response.json()
        setAccounts([...accounts, newAccount])
        setShowAddDialog(false)
        // Reset form
        setBankName('')
        setAccountName('')
        setAccountNumber('')
        setIban('')
        setOpeningBalance('')
      }
    } catch (error) {
      console.error('Failed to add account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banking</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and transactions
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions to review
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>Click on an account to view transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No bank accounts</h3>
              <p className="text-muted-foreground mb-4">
                Add your first bank account to get started
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow 
                    key={account.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/banking/${account.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {account.bank_name}
                      </div>
                    </TableCell>
                    <TableCell>{account.account_name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {account.iban ? formatIBAN(account.iban) : account.account_number}
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={account.current_balance < 0 ? 'text-red-600' : ''}>
                        {formatCurrency(account.current_balance, account.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Connect a new bank account to track transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <Input 
                placeholder="e.g., Emirates NBD" 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input 
                placeholder="e.g., Operating Account" 
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input 
                  placeholder="Account number" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>IBAN (Optional)</Label>
              <Input 
                placeholder="AE07 0331 2345 6789 0123 456" 
                value={iban}
                onChange={(e) => setIban(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00" 
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={isSubmitting || !bankName || !accountName || !accountNumber}>
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
