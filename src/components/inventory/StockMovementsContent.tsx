'use client'

import { useState } from 'react'
import { filsToAED, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Search, ArrowUpCircle, ArrowDownCircle, RefreshCcw, History } from 'lucide-react'
import type { StockMovement, Product } from '@/types/database'

type StockMovementWithProduct = StockMovement & { product: Product }

interface StockMovementsContentProps {
  movements: StockMovementWithProduct[]
  products: Product[]
}

const MOVEMENT_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  stock_in: { label: 'Stock In', icon: ArrowUpCircle, color: 'text-green-600' },
  stock_out: { label: 'Stock Out', icon: ArrowDownCircle, color: 'text-red-600' },
  adjustment: { label: 'Adjustment', icon: RefreshCcw, color: 'text-blue-600' },
  transfer_in: { label: 'Transfer In', icon: ArrowUpCircle, color: 'text-green-600' },
  transfer_out: { label: 'Transfer Out', icon: ArrowDownCircle, color: 'text-red-600' },
  sale: { label: 'Sale', icon: ArrowDownCircle, color: 'text-orange-600' },
  sale_return: { label: 'Sale Return', icon: ArrowUpCircle, color: 'text-green-600' },
}

export function StockMovementsContent({ movements: initialMovements, products }: StockMovementsContentProps) {
  const [movements] = useState(initialMovements)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter
    const matchesProduct = productFilter === 'all' || movement.product_id === productFilter
    return matchesSearch && matchesType && matchesProduct
  })

  // Stats
  const totalIn = movements
    .filter(m => ['stock_in', 'transfer_in', 'sale_return'].includes(m.movement_type))
    .reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = movements
    .filter(m => ['stock_out', 'transfer_out', 'sale'].includes(m.movement_type))
    .reduce((sum, m) => sum + m.quantity, 0)

  const getMovementTypeDisplay = (type: string) => {
    const config = MOVEMENT_TYPE_LABELS[type] || { label: type, icon: RefreshCcw, color: 'text-gray-600' }
    const Icon = config.icon
    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIn.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOut.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Movement Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock_in">Stock In</SelectItem>
            <SelectItem value="stock_out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="sale_return">Sale Return</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Movements Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDate(movement.movement_date)}</TableCell>
                  <TableCell>{getMovementTypeDisplay(movement.movement_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.product?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{movement.product?.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {['stock_in', 'transfer_in', 'sale_return'].includes(movement.movement_type) ? '+' : '-'}
                    {movement.quantity} {movement.product?.unit}
                  </TableCell>
                  <TableCell className="text-right">{filsToAED(movement.unit_cost)}</TableCell>
                  <TableCell className="text-right font-mono">{filsToAED(movement.total_cost)}</TableCell>
                  <TableCell>
                    {movement.reference_number && (
                      <Badge variant="outline">{movement.reference_number}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{movement.notes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
