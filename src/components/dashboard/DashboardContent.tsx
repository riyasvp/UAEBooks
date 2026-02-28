'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from '@/hooks/useAuth'

interface DashboardStats {
  revenue: number
  expenses: number
  netProfit: number
  overdueReceivables: number
  overduePayables: number
  overdueInvoicesCount: number
  cashBalance: number
  contactsCount: number
  accountsCount: number
  monthlyData: Array<{ month: string; revenue: number; expenses: number }>
  topExpenses: Array<{ category: string; amount: number }>
  recentActivity: Array<{
    type: 'invoice' | 'bill' | 'expense' | 'payment'
    id: string
    number: string
    amount: number
    date: string
    contact?: string
    status?: string
    description?: string
  }>
  overdueInvoicesList: Array<{
    id: string
    number: string
    amount: number
    contact?: string
    dueDate: string
  }>
}

export function DashboardContent() {
  const { isDemoMode } = useAuth()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pass demo mode header if in demo mode
        const headers: HeadersInit = {}
        if (isDemoMode) {
          headers['x-demo-mode'] = 'true'
        }
        
        const res = await fetch('/api/dashboard', { headers })
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [isDemoMode])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Unable to load dashboard</h3>
        <p className="text-muted-foreground">{error || 'Please try again later'}</p>
      </div>
    )
  }
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  
  const statCards = [
    {
      title: 'Total Revenue',
      value: stats.revenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Expenses',
      value: stats.expenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-8.2%',
      changeType: 'negative' as const,
    },
    {
      title: 'Net Profit',
      value: stats.netProfit,
      icon: DollarSign,
      color: stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100',
      change: stats.netProfit >= 0 ? 'Profit' : 'Loss',
      changeType: stats.netProfit >= 0 ? 'positive' : 'negative' as const,
    },
    {
      title: 'Cash Balance',
      value: stats.cashBalance,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: 'Available',
      changeType: 'neutral' as const,
    },
    {
      title: 'Overdue Receivables',
      value: stats.overdueReceivables,
      icon: ArrowUpRight,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `${stats.overdueInvoicesCount} invoices`,
      changeType: 'warning' as const,
    },
    {
      title: 'Overdue Payables',
      value: stats.overduePayables,
      icon: ArrowDownRight,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Due',
      changeType: 'warning' as const,
    },
  ]
  
  const COLORS = ['#1a56db', '#047857', '#f59e0b', '#8b5cf6', '#ec4899']
  
  const activityIcons: Record<string, React.ReactNode> = {
    invoice: <FileText className="h-4 w-4" />,
    bill: <FileText className="h-4 w-4" />,
    expense: <TrendingDown className="h-4 w-4" />,
    payment: <DollarSign className="h-4 w-4" />,
  }
  
  const activityColors: Record<string, string> = {
    invoice: 'bg-blue-100 text-blue-600',
    bill: 'bg-orange-100 text-orange-600',
    expense: 'bg-purple-100 text-purple-600',
    payment: 'bg-green-100 text-green-600',
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/dashboard/invoices/new">New Invoice</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard/expenses/new">New Expense</a>
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stat.value)}</div>
              <p className={cn(
                'text-xs mt-1',
                stat.changeType === 'positive' && 'text-green-600',
                stat.changeType === 'negative' && 'text-red-600',
                stat.changeType === 'warning' && 'text-orange-600',
                stat.changeType === 'neutral' && 'text-muted-foreground',
              )}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#047857" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expenses</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.topExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {stats.topExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No expense data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4">
                    <div className={cn('p-2 rounded-lg', activityColors[activity.type])}>
                      {activityIcons[activity.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{activity.contact || activity.description || activity.number}</p>
                        <Badge variant="outline" className="text-xs capitalize">{activity.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.number}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-medium',
                        activity.type === 'invoice' || activity.type === 'payment' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {activity.type === 'invoice' || activity.type === 'payment' ? '+' : '-'}
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* AI Insights / Overdue Invoices */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              AI Insights
            </CardTitle>
            <CardDescription>Action items that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.overdueInvoicesList.length > 0 && (
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">Overdue Invoices</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                  {stats.overdueInvoicesCount} invoice{stats.overdueInvoicesCount !== 1 ? 's' : ''} totaling {formatCurrency(stats.overdueReceivables)} are overdue.
                </p>
                <div className="space-y-1">
                  {stats.overdueInvoicesList.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="text-xs text-orange-600 dark:text-orange-400">
                      • {inv.number} - {inv.contact || 'Unknown'} ({formatCurrency(inv.amount)})
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Contact Growth</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You have {stats.contactsCount} contacts and {stats.accountsCount} accounts set up.
              </p>
            </div>
            
            {stats.netProfit > 0 && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Profitable Month</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your net profit this month is {formatCurrency(stats.netProfit)}. Keep up the great work!
                </p>
              </div>
            )}
            
            {stats.recentActivity.length === 0 && stats.contactsCount === 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Get started by adding your chart of accounts and contacts to see personalized insights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
