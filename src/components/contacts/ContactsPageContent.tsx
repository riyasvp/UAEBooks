'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, Users, Building2, Loader2, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContactSheet } from '@/components/contacts/ContactSheet'
import { createContactAction, updateContactAction } from '@/actions'
import type { Contact, InsertContact, Company } from '@/types/database'

interface ContactsPageContentProps {
  initialContacts?: Contact[]
  company?: Company | null
}

export function ContactsPageContent({ initialContacts, company }: ContactsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [contacts, setContacts] = React.useState<Contact[]>(initialContacts || [])
  const [isLoading, setIsLoading] = React.useState(!initialContacts)
  const [error, setError] = React.useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  
  // Get tab from URL
  const tab = searchParams.get('tab') || 'all'
  const searchQuery = searchParams.get('search') || ''
  
  // Fetch contacts
  const fetchContacts = React.useCallback(async () => {
    if (initialContacts) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/contacts')
      if (!res.ok) throw new Error('Failed to fetch contacts')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }, [initialContacts])
  
  React.useEffect(() => {
    fetchContacts()
  }, [fetchContacts])
  
  // Filter contacts
  const filteredContacts = React.useMemo(() => {
    let filtered = contacts
    
    if (tab !== 'all') {
      filtered = filtered.filter(c => c.type === tab || c.type === 'both')
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.trn?.includes(query)
      )
    }
    
    return filtered
  }, [contacts, tab, searchQuery])
  
  // Count by type
  const customerCount = contacts.filter(c => c.type === 'customer' || c.type === 'both').length
  const supplierCount = contacts.filter(c => c.type === 'supplier' || c.type === 'both').length
  
  // Handle create/update
  const handleSubmit = async (data: InsertContact): Promise<{ error?: string; data?: Contact }> => {
    const result = selectedContact 
      ? await updateContactAction(selectedContact.id, data)
      : await createContactAction(data)
    
    if (!result.error) {
      fetchContacts()
    }
    
    return result
  }
  
  // Update tab
  const updateTab = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newTab === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', newTab)
    }
    router.push(`/dashboard/contacts?${params.toString()}`)
  }
  
  // Update search
  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.push(`/dashboard/contacts?${params.toString()}`)
  }
  
  const typeColors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-800',
    supplier: 'bg-orange-100 text-orange-800',
    both: 'bg-green-100 text-green-800',
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your customers and suppliers
          </p>
        </div>
        <Button onClick={() => { setSelectedContact(null); setSheetOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierCount}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => updateSearch(e.target.value)}
                />
              </div>
            </div>
            <Tabs value={tab} onValueChange={updateTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="customer">Customers</TabsTrigger>
                <TabsTrigger value="supplier">Suppliers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {/* Contacts Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {contacts.length === 0 
                  ? 'Get started by creating your first contact'
                  : 'Try adjusting your filters'}
              </p>
              {contacts.length === 0 && (
                <Button onClick={() => setSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contact
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>TRN</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow 
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedContact(contact)
                      setSheetOpen(true)
                    }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        {contact.name_ar && (
                          <div className="text-sm text-muted-foreground">{contact.name_ar}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[contact.type]}>
                        {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contact.trn || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {contact.city || contact.emirate || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {contact.current_balance 
                        ? `AED ${(contact.current_balance / 100).toLocaleString()}`
                        : 'AED 0'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Sheet */}
      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={selectedContact}
        companyId={company?.id || ''}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
