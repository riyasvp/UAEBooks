'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createStockMovement, updateProduct } from '@/lib/db/queries'
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import type { Product } from '@/types/database'

interface InventoryPageContentProps {
  products: Product[]
  companyId: string
}

export function InventoryPageContent({ products: initialProducts, companyId }: InventoryPageContentProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockType, setStockType] = useState<'stock_in' | 'stock_out'>('stock_in')
  const [stockQuantity, setStockQuantity] = useState(0)
  const [stockNotes, setStockNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock_on_hand, 0),
    lowStock: products.filter(p => p.stock_on_hand <= p.reorder_level).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock_on_hand * p.cost_price), 0),
  }

  const handleStockMovement = async () => {
    if (!selectedProduct || stockQuantity <= 0) return
    
    setLoading(true)
    try {
      const unitCost = selectedProduct.cost_price
      await createStockMovement({
        company_id: companyId,
        product_id: selectedProduct.id,
        movement_type: stockType,
        quantity: stockQuantity,
        unit_cost: unitCost,
        total_cost: stockQuantity * unitCost,
        reference_type: 'manual',
        reference_id: null,
        reference_number: null,
        notes: stockNotes || null,
        movement_date: new Date().toISOString().split('T')[0],
        created_by: null,
      })
      
      // Update local state
      const quantityChange = stockType === 'stock_in' ? stockQuantity : -stockQuantity
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, stock_on_hand: p.stock_on_hand + quantityChange }
          : p
      ))
      
      setStockDialogOpen(false)
      setSelectedProduct(null)
      setStockQuantity(0)
      setStockNotes('')
      router.refresh()
    } catch (error) {
      console.error('Failed to create stock movement:', error)
    } finally {
      setLoading(false)
    }
  }

  const openStockDialog = (product: Product, type: 'stock_in' | 'stock_out') => {
    setSelectedProduct(product)
    setStockType(type)
    setStockQuantity(0)
    setStockNotes('')
    setStockDialogOpen(true)
  }

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
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filsToAED(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No products found. Add products to track inventory.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.stock_on_hand <= product.reorder_level
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.name_ar && (
                        <div className="text-sm text-muted-foreground" dir="rtl">{product.name_ar}</div>
                      )}
                    </TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell className="text-right">{filsToAED(product.cost_price)}</TableCell>
                    <TableCell className="text-right">{filsToAED(product.selling_price)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                        {product.stock_on_hand} {product.unit}
                      </Badge>
                      {isLowStock && (
                        <div className="text-xs text-red-500 mt-1">Below reorder level</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {filsToAED(product.stock_on_hand * product.cost_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockDialog(product, 'stock_in')}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          In
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockDialog(product, 'stock_out')}
                          disabled={product.stock_on_hand <= 0}
                        >
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Out
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stock Movement Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stockType === 'stock_in' ? 'Stock In' : 'Stock Out'} - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-lg font-medium">{selectedProduct?.stock_on_hand} {selectedProduct?.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Cost</p>
                <p className="text-lg font-medium">{selectedProduct ? filsToAED(selectedProduct.cost_price) : '-'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                placeholder="Enter quantity"
                min={1}
                max={stockType === 'stock_out' ? (selectedProduct?.stock_on_hand || 0) : undefined}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span>Total Value</span>
                <span className="font-bold">
                  {filsToAED((stockQuantity || 0) * (selectedProduct?.cost_price || 0))}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStockMovement} disabled={loading || stockQuantity <= 0}>
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
