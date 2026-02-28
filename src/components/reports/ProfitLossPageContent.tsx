'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProfitLossReport } from '@/components/reports/ProfitLossReport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { getProfitAndLoss } from '@/lib/db/queries'
import { Calendar, RefreshCcw } from 'lucide-react'
import type { ProfitLossData } from '@/components/reports/ProfitLossReport'

interface ProfitLossPageContentProps {
  initialData: ProfitLossData
  initialStartDate: string
  initialEndDate: string
  company: { name: string }
  companyId: string
}

export function ProfitLossPageContent({ 
  initialData, 
  initialStartDate, 
  initialEndDate,
  company,
  companyId 
}: ProfitLossPageContentProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await fetch(`/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`).then(r => r.json())
      setData(result)
      router.push(`/dashboard/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`)
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
      <ProfitLossReport 
        data={data}
        startDate={startDate}
        endDate={endDate}
        company={company}
      />
    </div>
  )
}
