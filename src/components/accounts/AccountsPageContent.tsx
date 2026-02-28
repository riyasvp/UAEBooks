'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, FolderTree, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AccountModal } from '@/components/accounts/AccountModal'
import { 
  createAccountAction, 
  updateAccountAction, 
  deleteAccountAction,
  loadIndustryCOAAction 
} from '@/actions'
import type { Account, InsertAccount, Company } from '@/types/database'

interface AccountsPageContentProps {
  initialAccounts?: Account[]
  company?: Company | null
}

const accountTypeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  revenue: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  cogs: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
}

export function AccountsPageContent({ initialAccounts, company }: AccountsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [accounts, setAccounts] = React.useState<Account[]>(initialAccounts || [])
  const [isLoading, setIsLoading] = React.useState(!initialAccounts)
  const [error, setError] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
  const [loadingTemplate, setLoadingTemplate] = React.useState(false)
  
  // Filters
  const typeFilter = searchParams.get('type') || ''
  const searchQuery = searchParams.get('search') || ''
  
  // Fetch accounts
  const fetchAccounts = React.useCallback(async () => {
    if (initialAccounts) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) throw new Error('Failed to fetch accounts')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }, [initialAccounts])
  
  React.useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])
  
  // Filter accounts
  const filteredAccounts = React.useMemo(() => {
    let filtered = accounts
    
    if (typeFilter) {
      filtered = filtered.filter(a => a.type === typeFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.code.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [accounts, typeFilter, searchQuery])
  
  // Build tree structure
  const accountTree = React.useMemo(() => {
    const buildTree = (parentId: string | null): (Account & { children: Account[] })[] => {
      return filteredAccounts
        .filter(a => a.parent_id === parentId)
        .map(a => ({ ...a, children: buildTree(a.id) }))
    }
    return buildTree(null)
  }, [filteredAccounts])
  
  // Handle create/update
  const handleSubmit = async (data: InsertAccount): Promise<{ error?: string; data?: Account }> => {
    const result = selectedAccount 
      ? await updateAccountAction(selectedAccount.id, data)
      : await createAccountAction(data)
    
    if (!result.error) {
      fetchAccounts()
    }
    
    return result
  }
  
  // Handle load template
  const handleLoadTemplate = async () => {
    if (!company?.id || !company?.industry) return
    
    setLoadingTemplate(true)
    try {
      const result = await loadIndustryCOAAction(company.id, company.industry as any)
      if (result.error) {
        setError(result.error)
      } else {
        fetchAccounts()
      }
    } catch (err) {
      setError('Failed to load template')
    } finally {
      setLoadingTemplate(false)
    }
  }
  
  // Update URL params
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/accounts?${params.toString()}`)
  }
  
  // Render account row
  const renderAccountRow = (account: Account & { children: Account[] }, depth = 0) => (
    <React.Fragment key={account.id}>
      <TableRow 
        className={depth > 0 ? 'bg-muted/30' : ''}
        onClick={() => {
          setSelectedAccount(account)
          setModalOpen(true)
        }}
        style={{ cursor: 'pointer' }}
      >
        <TableCell className="font-mono">
          <span style={{ paddingLeft: `${depth * 20}px` }}>
            {account.code}
          </span>
        </TableCell>
        <TableCell>
          <span style={{ paddingLeft: `${depth * 0}px` }}>
            {account.name}
          </span>
        </TableCell>
        <TableCell>
          <Badge className={accountTypeColors[account.type]}>
            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
          </Badge>
        </TableCell>
        <TableCell>
          {account.parent_id ? accounts.find(a => a.id === account.parent_id)?.name : '-'}
        </TableCell>
        <TableCell className="text-right">
          {account.opening_balance ? `AED ${(account.opening_balance / 100).toLocaleString()}` : '-'}
        </TableCell>
        <TableCell>
          {account.is_active ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
        </TableCell>
      </TableRow>
      {account.children.map(child => renderAccountRow(child as any, depth + 1))}
    </React.Fragment>
  )
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your company's accounts and categories
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={handleLoadTemplate} disabled={loadingTemplate}>
              {loadingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FolderTree className="mr-2 h-4 w-4" />
                  Load Default COA
                </>
              )}
            </Button>
          )}
          <Button onClick={() => { setSelectedAccount(null); setModalOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => updateParams('search', e.target.value)}
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(v) => updateParams('type', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="cogs">Cost of Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredAccounts.length} Account{filteredAccounts.length !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            Click on an account to edit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No accounts found</h3>
              <p className="text-muted-foreground mb-4">
                {accounts.length === 0 
                  ? 'Get started by loading a default chart of accounts for your industry'
                  : 'Try adjusting your filters'}
              </p>
              {accounts.length === 0 && (
                <Button onClick={handleLoadTemplate} disabled={loadingTemplate}>
                  {loadingTemplate ? 'Loading...' : 'Load Default COA'}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[180px]">Parent</TableHead>
                  <TableHead className="text-right w-[150px]">Opening Balance</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTree.map(account => renderAccountRow(account))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Modal */}
      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={selectedAccount}
        accounts={accounts}
        companyId={company?.id || ''}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
