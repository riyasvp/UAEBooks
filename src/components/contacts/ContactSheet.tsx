'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Contact, InsertContact } from '@/types/database'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  name_ar: z.string().max(200).optional().nullable(),
  type: z.enum(['customer', 'supplier', 'both']),
  trn: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  emirate: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('UAE'),
  payment_terms_days: z.number().min(0).max(365).default(30),
  credit_limit: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().default(true),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  companyId: string
  onSubmit: (data: InsertContact) => Promise<{ error?: string; data?: Contact }>
}

const emirates = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

export function ContactSheet({ open, onOpenChange, contact, companyId, onSubmit }: ContactSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name || '',
      name_ar: contact?.name_ar || null,
      type: (contact?.type as 'customer' | 'supplier' | 'both') || 'customer',
      trn: contact?.trn || null,
      email: contact?.email || null,
      phone: contact?.phone || null,
      mobile: contact?.mobile || null,
      address: contact?.address || null,
      city: contact?.city || null,
      emirate: contact?.emirate || null,
      country: contact?.country || 'UAE',
      payment_terms_days: contact?.payment_terms_days || 30,
      credit_limit: contact?.credit_limit || null,
      notes: contact?.notes || null,
      is_active: contact?.is_active ?? true,
    },
  })
  
  React.useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        name_ar: contact.name_ar,
        type: contact.type as 'customer' | 'supplier' | 'both',
        trn: contact.trn,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        address: contact.address,
        city: contact.city,
        emirate: contact.emirate,
        country: contact.country || 'UAE',
        payment_terms_days: contact.payment_terms_days,
        credit_limit: contact.credit_limit,
        notes: contact.notes,
        is_active: contact.is_active,
      })
    } else {
      form.reset({
        name: '',
        name_ar: null,
        type: 'customer',
        trn: null,
        email: null,
        phone: null,
        mobile: null,
        address: null,
        city: null,
        emirate: null,
        country: 'UAE',
        payment_terms_days: 30,
        credit_limit: null,
        notes: null,
        is_active: true,
      })
    }
  }, [contact, form])
  
  const handleSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        ...values,
        company_id: companyId,
        name_ar: values.name_ar || null,
        trn: values.trn || null,
        email: values.email || null,
        phone: values.phone || null,
        mobile: values.mobile || null,
        address: values.address || null,
        city: values.city || null,
        emirate: values.emirate || null,
        credit_limit: values.credit_limit || null,
        notes: values.notes || null,
        currency: 'AED',
        current_balance: 0,
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
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {contact ? 'Edit Contact' : 'New Contact'}
          </SheetTitle>
          <SheetDescription>
            {contact ? 'Update the contact details.' : 'Create a new customer or supplier.'}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or person name" {...field} />
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
                  <FormLabel>Arabic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم بالعربية" {...field} value={field.value || ''} />
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
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="trn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TRN (Tax Registration Number)</FormLabel>
                  <FormControl>
                    <Input placeholder="15-digit TRN" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+971 XX XXX XXXX" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emirate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emirate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select emirate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {emirates.map(em => (
                          <SelectItem key={em} value={em}>{em}</SelectItem>
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
                name="payment_terms_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (AED)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10000" 
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(parseFloat(e.target.value) || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            
            <SheetFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : contact ? 'Update' : 'Create'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
