import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
