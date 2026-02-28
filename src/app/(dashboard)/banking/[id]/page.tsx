import { notFound, redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { createClient } from '@/lib/supabase/server'
import { BankAccountDetail } from '@/components/banking/BankAccountDetail'

export default async function BankAccountPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const companyId = await getActiveCompanyId()
  
  if (!companyId) {
    redirect('/dashboard')
  }
  
  const supabase = await createClient()
  
  const { data: account, error } = await supabase
    .from('bank_accounts')
    .select(`
      *,
      transactions:bank_transactions(
        *
      )
    `)
    .eq('id', params.id)
    .single()
  
  if (error || !account || account.company_id !== companyId) {
    notFound()
  }
  
  // Get payments linked to this account
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      contact:contacts(name),
      invoice:invoices(invoice_number),
      bill:bills(bill_number)
    `)
    .eq('bank_account_id', params.id)
    .order('payment_date', { ascending: false })
  
  return <BankAccountDetail account={account} payments={payments || []} />
}
