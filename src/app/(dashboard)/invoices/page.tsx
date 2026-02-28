'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { InvoicesPageContent } from '@/components/invoices/InvoicesPageContent'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Invoice, Contact } from '@/types/database'

export default function InvoicesPage() {
  const { isDemoMode } = useAuth()
  const [data, setData] = React.useState<{ invoices: Invoice[]; contacts: Contact[] } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: HeadersInit = {}
        if (isDemoMode) {
          headers['x-demo-mode'] = 'true'
        }
        
        const res = await fetch('/api/invoices', { headers })
        if (!res.ok) throw new Error('Failed to fetch invoices')
        const json = await res.json()
        setData({ invoices: json.invoices, contacts: json.contacts })
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
        <h3 className="text-lg font-medium">Unable to load invoices</h3>
        <p className="text-muted-foreground">{error || 'Please try again later'}</p>
      </div>
    )
  }

  return <InvoicesPageContent initialInvoices={data.invoices} contacts={data.contacts} />
}
