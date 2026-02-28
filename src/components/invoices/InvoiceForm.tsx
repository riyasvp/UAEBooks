'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addDays } from 'date-fns'
import { Plus, Trash2, Save, Send, ArrowLeft, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createInvoiceAction } from '@/actions'
import type { Contact, Account, Product } from '@/types/database'

const invoiceSchema = z.object({
  contact_id: z.string().min(1, 'Customer is required'),
  invoice_date: z.string(),
  due_date: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
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

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  contacts: Contact[]
  accounts: Account[]
  products: Product[]
  companyId: string
}

export function InvoiceForm({ contacts, accounts, products, companyId }: InvoiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [saveAs, setSaveAs] = React.useState<'draft' | 'sent'>('draft')
  
  // Filter customers
  const customers = contacts.filter(c => c.type === 'customer' || c.type === 'both')
  
  // Revenue accounts for line items
  const revenueAccounts = accounts.filter(a => a.type === 'revenue' || a.type === 'cogs')
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contact_id: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      reference: '',
      notes: '',
      terms: 'Payment is due within 30 days.',
      items: [
        {
          product_id: null,
          account_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount: 0,
          vat_rate: 500, // 5%
        }
      ],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })
  
  const watchItems = form.watch('items')
  
  // Calculate totals
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
  
  // Handle customer change - set payment terms
  const handleCustomerChange = (customerId: string) => {
    form.setValue('contact_id', customerId)
    const customer = customers.find(c => c.id === customerId)
    if (customer?.payment_terms_days) {
      const invoiceDate = form.getValues('invoice_date')
      const dueDate = addDays(new Date(invoiceDate), customer.payment_terms_days)
      form.setValue('due_date', format(dueDate, 'yyyy-MM-dd'))
    }
  }
  
  // Handle product selection
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      form.setValue(`items.${index}.product_id`, productId)
      form.setValue(`items.${index}.description`, product.name)
      form.setValue(`items.${index}.unit_price`, product.selling_price)
      form.setValue(`items.${index}.vat_rate`, product.vat_rate)
    }
  }
  
  // Add line item
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
  
  // Submit handler
  const onSubmit = async (values: InvoiceFormValues, status: 'draft' | 'sent') => {
    setIsSubmitting(true)
    
    try {
      // Convert amounts to fils (cents)
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
      
      const result = await createInvoiceAction({
        invoice: {
          company_id: companyId,
          contact_id: values.contact_id,
          invoice_date: values.invoice_date,
          due_date: values.due_date,
          reference: values.reference || null,
          status: status,
          currency: 'AED',
          subtotal: totals.subtotal,
          discount_total: 0,
          vat_total: totals.vatTotal,
          total: totals.grandTotal,
          amount_paid: 0,
          notes: values.notes || null,
          terms: values.terms || null,
        },
        items,
      })
      
      if (result.error) {
        form.setError('root', { message: result.error })
      } else {
        router.push('/dashboard/invoices')
      }
    } catch (error) {
      form.setError('root', { message: 'Failed to create invoice' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const formatCurrency = (value: number) => {
    return `AED ${(value / 100).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit(v, saveAs))} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Invoice</h1>
              <p className="text-muted-foreground">Create a new sales invoice</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              type="submit" 
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setSaveAs('draft')}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSaveAs('sent')}
            >
              <Send className="mr-2 h-4 w-4" />
              Save & Send
            </Button>
          </div>
        </div>
        
        {form.formState.errors.root && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select onValueChange={handleCustomerChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference / PO Number</FormLabel>
                      <FormControl>
                        <Input placeholder="PO-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date *</FormLabel>
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
                <CardDescription>Add products or services to the invoice</CardDescription>
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
                      const vatRate = form.watch(`items.${index}.vat_rate`) || 0
                      const lineTotal = Math.round(qty * price - discount)
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div className="space-y-2">
                              <Select onValueChange={(v) => handleProductChange(index, v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product/service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                                    {revenueAccounts.map(acc => (
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
                                    <SelectItem value="0">Exempt</SelectItem>
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
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes visible to customer" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Payment terms" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
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
            
            <Card>
              <CardHeader>
                <CardTitle>VAT Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard Rated (5%)</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT Amount</span>
                    <span>{formatCurrency(totals.vatTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
