'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PayrollRunsContent } from '@/components/payroll/PayrollRunsContent'
import { Loader2, AlertCircle } from 'lucide-react'
import type { PayrollRun } from '@/types/database'

export default function PayrollPage() {
  const { isDemoMode } = useAuth()
  const [data, setData] = React.useState<{ payrollRuns: PayrollRun[] } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: HeadersInit = {}
        if (isDemoMode) {
          headers['x-demo-mode'] = 'true'
        }
        
        const res = await fetch('/api/payroll', { headers })
        if (!res.ok) throw new Error('Failed to fetch payroll')
        const json = await res.json()
        setData({ payrollRuns: json.payrollRuns })
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
        <h3 className="text-lg font-medium">Unable to load payroll</h3>
        <p className="text-muted-foreground">{error || 'Please try again later'}</p>
      </div>
    )
  }

  return <PayrollRunsContent payrollRuns={data.payrollRuns as any} companyId="demo-company-001" />
}
