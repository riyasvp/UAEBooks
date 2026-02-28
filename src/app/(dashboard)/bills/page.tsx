'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BillsPageContent } from '@/components/bills/BillsPageContent'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Bill, Contact } from '@/types/database'

export default function BillsPage() {
  const { isDemoMode } = useAuth()
  const [data, setData] = React.useState<{ bills: Bill[]; suppliers: Contact[] } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: HeadersInit = {}
        if (isDemoMode) {
          headers['x-demo-mode'] = 'true'
        }
        
        const res = await fetch('/api/bills', { headers })
        if (!res.ok) throw new Error('Failed to fetch bills')
        const json = await res.json()
        setData({ bills: json.bills, suppliers: json.suppliers })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [isDemoMode])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Unable to load bills</h3>
        <p className="text-muted-foreground">{error || 'Please try again later'}</p>
      </div>
    )
  }

  return <BillsPageContent initialBills={data.bills} contacts={data.suppliers} />
}
