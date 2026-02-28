import { getActiveCompanyId } from '@/lib/auth/company'
import { getProducts } from '@/lib/db/queries'
import { InventoryPageContent } from '@/components/inventory/InventoryPageContent'

export default async function InventoryProductsPage() {
  const companyId = await getActiveCompanyId()
  
  const products = companyId ? await getProducts(companyId) : []
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          Manage your product stock levels
        </p>
      </div>
      
      <InventoryPageContent 
        products={products}
        companyId={companyId || ''}
      />
    </div>
  )
}
