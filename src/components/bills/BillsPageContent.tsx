'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Search, FileText, Filter, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { Bill, Contact } from '@/types/database'

interface BillsPageContentProps {
  initialBills: Bill[]
  contacts: Contact[]
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

export function BillsPageContent({ initialBills, contacts }: BillsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [bills, setBills] = React.useState(initialBills)
  
  const statusFilter = searchParams.get('status') || ''
  const searchQuery = searchParams.get('search') || ''
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>()
  const [dateTo, setDateTo] = React.useState<Date | undefined>()
  
  const filteredBills = React.useMemo(() => {
    let filtered = bills
    
    if (statusFilter) {
      filtered = filtered.filter(bill => bill.status === statusFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(bill => 
        bill.bill_number.toLowerCase().includes(query) ||
        (bill.contact as any)?.name?.toLowerCase().includes(query)
      )
    }
    
    if (dateFrom) {
      filtered = filtered.filter(bill => new Date(bill.bill_date) >= dateFrom)
    }
    
    if (dateTo) {
      filtered = filtered.filter(bill => new Date(bill.bill_date) <= dateTo)
    }
    
    return filtered
  }, [bills, statusFilter, searchQuery, dateFrom, dateTo])
  
  const stats = React.useMemo(() => {
    const total = bills.length
    const draft = bills.filter(b => b.status === 'draft').length
    const paid = bills.filter(b => b.status === 'paid').length
    const overdue = bills.filter(b => b.status === 'overdue').length
    const totalAmount = bills.reduce((sum, b) => sum + (b.total || 0), 0)
    
    return { total, draft, paid, overdue, totalAmount }
  }, [bills])
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString()}`
  }
  
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/bills?${params.toString()}`)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bills</h1>
          <p className="text-muted-foreground">
            Manage supplier bills and purchases
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/bills/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Bill
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-sm text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => updateParams('search', e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => updateParams('status', v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd MMM') : 'Date From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px]">
                  {dateTo ? format(dateTo, 'dd MMM') : 'Date To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(statusFilter || searchQuery || dateFrom || dateTo) && (
              <Button variant="ghost" onClick={() => {
                router.push('/dashboard/bills')
                setDateFrom(undefined)
                setDateTo(undefined)
              }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Bills Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No bills found</h3>
              <p className="text-muted-foreground mb-4">
                {bills.length === 0 
                  ? 'Record your first supplier bill'
                  : 'Try adjusting your filters'}
              </p>
              {bills.length === 0 && (
                <Button onClick={() => router.push('/dashboard/bills/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bill
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Bill #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow 
                    key={bill.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/bills/${bill.id}`)}
                  >
                    <TableCell className="font-medium">{bill.bill_number}</TableCell>
                    <TableCell>
                      {(bill.contact as any)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{bill.supplier_reference || '-'}</TableCell>
                    <TableCell>{bill.bill_date}</TableCell>
                    <TableCell>
                      <span className={cn(
                        bill.status === 'overdue' && 'text-red-600 font-medium'
                      )}>
                        {bill.due_date}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(bill.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[bill.status]}>
                        {bill.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bills/${bill.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bills/${bill.id}?edit=true`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
