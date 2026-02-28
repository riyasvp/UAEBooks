import { getActiveCompanyId } from '@/lib/auth/company'
import { getBankAccounts } from '@/lib/db/queries'
import { BankingPageContent } from '@/components/banking/BankingPageContent'

export default async function BankingPage() {
  const companyId = await getActiveCompanyId()
  
  const accounts = companyId ? await getBankAccounts(companyId) : []
  
  return (
    <BankingPageContent 
      initialAccounts={accounts}
      companyId={companyId || ''}
    />
  )
}
