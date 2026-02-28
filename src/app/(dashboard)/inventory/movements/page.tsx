import { getActiveCompanyId } from '@/lib/auth/company'
import { getStockMovements, getProducts } from '@/lib/db/queries'
import { StockMovementsContent } from '@/components/inventory/StockMovementsContent'

export default async function StockMovementsPage() {
  const companyId = await getActiveCompanyId()
  
  const [movements, products] = await Promise.all([
    companyId ? getStockMovements(companyId) : [],
    companyId ? getProducts(companyId) : []
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <p className="text-muted-foreground">
          History of all inventory transactions
        </p>
      </div>
      
      <StockMovementsContent 
        movements={movements as any}
        products={products}
      />
    </div>
  )
}
