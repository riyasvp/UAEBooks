'use client'

import { filsToAED } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react'

interface StockValuationItem {
  product_id: string
  sku: string
  name: string
  stock_on_hand: number
  unit_cost: number
  total_value: number
  reorder_level: number
  needs_reorder: boolean
}

interface StockValuationContentProps {
  valuation: {
    items: StockValuationItem[]
    totalValue: number
    itemCount: number
    lowStockCount: number
  }
}

export function StockValuationContent({ valuation }: StockValuationContentProps) {
  const { items, totalValue, itemCount, lowStockCount } = valuation

  // Sort by value descending
  const sortedItems = [...items].sort((a, b) => b.total_value - a.total_value)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filsToAED(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Value/Item</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filsToAED(itemCount > 0 ? totalValue / itemCount : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valuation Method Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <p className="text-sm text-blue-800">
            <strong>Valuation Method:</strong> Average Cost (simplified). 
            Stock value is calculated as quantity on hand × cost price.
          </p>
        </CardContent>
      </Card>

      {/* Valuation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Valuation Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Qty on Hand</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inventory items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {sortedItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.stock_on_hand}</TableCell>
                        <TableCell className="text-right">{filsToAED(item.unit_cost)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {filsToAED(item.total_value)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.needs_reorder ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>Total</TableCell>
                      <TableCell className="text-right font-mono">
                        {filsToAED(totalValue)}
                      </TableCell>
                      <TableCell />
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
