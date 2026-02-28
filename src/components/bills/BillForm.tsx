'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addDays } from 'date-fns'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createBillAction } from '@/actions'
import type { Contact, Account, Product } from '@/types/database'

const billSchema = z.object({
  contact_id: z.string().min(1, 'Supplier is required'),
  bill_date: z.string(),
  due_date: z.string(),
  supplier_reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().optional().nullable(),
    account_id: z.string().min(1, 'Account is required'),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Qty must be greater than 0'),
    unit_price: z.number().min(0, 'Price must be positive'),
    discount: z.number().min(0).default(0),
    vat_rate: z.number().min(0).max(10000),
  })),
})

type BillFormValues = z.infer<typeof billSchema>

interface BillFormProps {
  contacts: Contact[]
  accounts: Account[]
  products: Product[]
  companyId: string
}

export function BillForm({ contacts, accounts, products, companyId }: BillFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const suppliers = contacts.filter(c => c.type === 'supplier' || c.type === 'both')
  const expenseAccounts = accounts.filter(a => a.type === 'expense' || a.type === 'cogs' || a.type === 'asset')
  
  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      contact_id: '',
      bill_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      supplier_reference: '',
      notes: '',
      items: [
        {
          product_id: null,
          account_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount: 0,
          vat_rate: 500,
        }
      ],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })
  
  const watchItems = form.watch('items')
  
  const totals = React.useMemo(() => {
    let subtotal = 0
    let vatTotal = 0
    
    for (const item of watchItems) {
      const lineTotal = (item.quantity || 0) * (item.unit_price || 0) - (item.discount || 0)
      subtotal += lineTotal
      const vatAmount = Math.round(lineTotal * ((item.vat_rate || 0) / 10000))
      vatTotal += vatAmount
    }
    
    return {
      subtotal,
      vatTotal,
      grandTotal: subtotal + vatTotal,
    }
  }, [watchItems])
  
  const handleSupplierChange = (supplierId: string) => {
    form.setValue('contact_id', supplierId)
    const supplier = suppliers.find(c => c.id === supplierId)
    if (supplier?.payment_terms_days) {
      const billDate = form.getValues('bill_date')
      const dueDate = addDays(new Date(billDate), supplier.payment_terms_days)
      form.setValue('due_date', format(dueDate, 'yyyy-MM-dd'))
    }
  }
  
  const addItem = () => {
    append({
      product_id: null,
      account_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      vat_rate: 500,
    })
  }
  
  const onSubmit = async (values: BillFormValues) => {
    setIsSubmitting(true)
    
    try {
      const items = values.items.map(item => {
        const lineTotal = Math.round(item.quantity * item.unit_price - item.discount)
        const vatAmount = Math.round(lineTotal * (item.vat_rate / 10000))
        
        return {
          product_id: item.product_id || null,
          account_id: item.account_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: Math.round(item.unit_price),
          discount: Math.round(item.discount),
          vat_rate: item.vat_rate,
          vat_amount: vatAmount,
          line_total: lineTotal,
        }
      })
      
      const result = await createBillAction({
        bill: {
          company_id: companyId,
          contact_id: values.contact_id,
          bill_date: values.bill_date,
          due_date: values.due_date,
          supplier_reference: values.supplier_reference || null,
          status: 'approved',
          currency: 'AED',
          subtotal: totals.subtotal,
          discount_total: 0,
          vat_total: totals.vatTotal,
          total: totals.grandTotal,
          amount_paid: 0,
          notes: values.notes || null,
        },
        items,
      })
      
      if (result.error) {
        form.setError('root', { message: result.error })
      } else {
        router.push('/dashboard/bills')
      }
    } catch (error) {
      form.setError('root', { message: 'Failed to create bill' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Bill</h1>
              <p className="text-muted-foreground">Record a supplier bill</p>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Bill'}
          </Button>
        </div>
        
        {form.formState.errors.root && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select onValueChange={handleSupplierChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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
                  name="supplier_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Invoice #</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier's invoice number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bill_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead className="w-[150px]">Account</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Unit Price</TableHead>
                      <TableHead className="w-[80px]">VAT %</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const qty = form.watch(`items.${index}.quantity`) || 0
                      const price = form.watch(`items.${index}.unit_price`) || 0
                      const discount = form.watch(`items.${index}.discount`) || 0
                      const lineTotal = Math.round(qty * price - discount)
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div className="space-y-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <Input placeholder="Description" {...field} />
                                )}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.account_id`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {expenseAccounts.map(acc => (
                                      <SelectItem key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit_price`}
                              render={({ field }) => (
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.vat_rate`}
                              render={({ field }) => (
                                <Select onValueChange={v => field.onChange(parseInt(v))} value={String(field.value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="500">5%</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(lineTotal)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                
                <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line Item
                </Button>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Internal notes" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (5%)</span>
                  <span>{formatCurrency(totals.vatTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
