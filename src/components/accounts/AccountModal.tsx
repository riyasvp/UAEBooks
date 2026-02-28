'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Account, InsertAccount } from '@/types/database'

const accountSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(200),
  name_ar: z.string().max(200).optional().nullable(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense', 'cogs']),
  sub_type: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  vat_applicable: z.boolean().default(false),
  vat_rate: z.number().optional().nullable(),
  opening_balance: z.number().default(0),
  is_active: z.boolean().default(true),
})

type AccountFormValues = z.infer<typeof accountSchema>

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  accounts: Account[]
  companyId: string
  onSubmit: (data: InsertAccount) => Promise<{ error?: string; data?: Account }>
}

const accountTypes = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'cogs', label: 'Cost of Sales' },
]

const accountSubTypes: Record<string, { value: string; label: string }[]> = {
  asset: [
    { value: 'current_asset', label: 'Current Asset' },
    { value: 'fixed_asset', label: 'Fixed Asset' },
  ],
  liability: [
    { value: 'current_liability', label: 'Current Liability' },
    { value: 'long_term_liability', label: 'Long Term Liability' },
  ],
  equity: [
    { value: 'equity', label: 'Equity' },
  ],
  revenue: [
    { value: 'income', label: 'Income' },
    { value: 'other_income', label: 'Other Income' },
  ],
  expense: [
    { value: 'operating_expense', label: 'Operating Expense' },
    { value: 'other_expense', label: 'Other Expense' },
  ],
  cogs: [
    { value: 'cost_of_sales', label: 'Cost of Sales' },
  ],
}

export function AccountModal({ open, onOpenChange, account, accounts, companyId, onSubmit }: AccountModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: account?.code || '',
      name: account?.name || '',
      name_ar: account?.name_ar || null,
      type: account?.type || 'asset',
      sub_type: account?.sub_type || null,
      parent_id: account?.parent_id || null,
      vat_applicable: account?.vat_applicable || false,
      vat_rate: account?.vat_rate || null,
      opening_balance: account?.opening_balance || 0,
      is_active: account?.is_active ?? true,
    },
  })
  
  const selectedType = form.watch('type')
  const vatApplicable = form.watch('vat_applicable')
  
  React.useEffect(() => {
    if (account) {
      form.reset({
        code: account.code,
        name: account.name,
        name_ar: account.name_ar,
        type: account.type,
        sub_type: account.sub_type,
        parent_id: account.parent_id,
        vat_applicable: account.vat_applicable,
        vat_rate: account.vat_rate,
        opening_balance: account.opening_balance,
        is_active: account.is_active,
      })
    } else {
      form.reset({
        code: '',
        name: '',
        name_ar: null,
        type: 'asset',
        sub_type: null,
        parent_id: null,
        vat_applicable: false,
        vat_rate: null,
        opening_balance: 0,
        is_active: true,
      })
    }
  }, [account, form])
  
  const handleSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        ...values,
        company_id: companyId,
        name_ar: values.name_ar || null,
        sub_type: values.sub_type || null,
        parent_id: values.parent_id || null,
        vat_rate: values.vat_applicable ? (values.vat_rate || 500) : null,
        current_balance: values.opening_balance,
      })
      
      if (result.error) {
        form.setError('root', { message: result.error })
      } else {
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Filter accounts for parent dropdown (same type, not self)
  const parentAccounts = accounts.filter(a => 
    a.type === selectedType && a.id !== account?.id
  )
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Edit Account' : 'New Account'}
          </DialogTitle>
          <DialogDescription>
            {account ? 'Update the account details.' : 'Create a new account in your chart of accounts.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Account name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arabic Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم الحساب" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sub_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(accountSubTypes[selectedType] || []).map(st => (
                          <SelectItem key={st.value} value={st.value}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {parentAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opening_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Balance (AED)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vat_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="5" 
                        disabled={!vatApplicable}
                        {...field}
                        value={field.value ? field.value / 100 : ''}
                        onChange={e => field.onChange(parseFloat(e.target.value) ? parseFloat(e.target.value) * 100 : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="vat_applicable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      VAT Applicable
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Active
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : account ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
