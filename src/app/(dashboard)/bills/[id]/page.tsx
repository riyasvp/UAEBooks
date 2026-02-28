import { notFound, redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { createClient } from '@/lib/supabase/server'
import { BillDetail } from '@/components/bills/BillDetail'

export default async function BillDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const companyId = await getActiveCompanyId()
  
  if (!companyId) {
    redirect('/dashboard')
  }
  
  const supabase = await createClient()
  
  const { data: bill, error } = await supabase
    .from('bills')
    .select(`
      *,
      contact:contacts(*),
      items:bill_items(*)
    `)
    .eq('id', params.id)
    .single()
  
  if (error || !bill || bill.company_id !== companyId) {
    notFound()
  }
  
  return <BillDetail bill={bill} />
}
