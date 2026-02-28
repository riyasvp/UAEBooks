'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BalanceSheetReport } from '@/components/reports/BalanceSheetReport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCcw } from 'lucide-react'
import type { BalanceSheetData } from '@/components/reports/BalanceSheetReport'

interface BalanceSheetPageContentProps {
  initialData: BalanceSheetData
  initialAsOfDate: string
  company: { name: string }
}

export function BalanceSheetPageContent({ 
  initialData, 
  initialAsOfDate,
  company,
}: BalanceSheetPageContentProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [asOfDate, setAsOfDate] = useState(initialAsOfDate)
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await fetch(`/api/reports/balance-sheet?asOfDate=${asOfDate}`).then(r => r.json())
      setData(result)
      router.push(`/dashboard/reports/balance-sheet?asOfDate=${asOfDate}`)
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>As of Date</Label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      <BalanceSheetReport 
        data={data}
        asOfDate={asOfDate}
        company={company}
      />
    </div>
  )
}
