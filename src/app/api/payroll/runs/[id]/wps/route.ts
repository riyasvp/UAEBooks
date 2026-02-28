import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toDirhams } from '@/lib/utils'

// WPS SIF File Format for UAE Central Bank
// Reference: UAE Central Bank WPS Guidelines

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params
    const supabase = await createClient()

    // Get payroll run with employee details
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select(`
        *,
        items:payroll_items(
          *,
          employee:employees(*)
        )
      `)
      .eq('id', runId)
      .single()

    if (runError || !run) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
    }

    if (run.status !== 'processed') {
      return NextResponse.json({ error: 'Payroll run must be processed before WPS export' }, { status: 400 })
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', run.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate period dates
    const periodStart = new Date(run.run_year, run.run_month - 1, 1)
    const periodEnd = new Date(run.run_year, run.run_month, 0)
    const startDateStr = formatDateForSIF(periodStart)
    const endDateStr = formatDateForSIF(periodEnd)

    // Validate and filter employees for WPS
    const validItems: typeof run.items = []
    const invalidItems: { employee: any; reason: string }[] = []

    for (const item of run.items) {
      const emp = item.employee
      const issues: string[] = []

      if (!emp.labour_card_no) issues.push('Missing Labour Card Number')
      if (!emp.iban) issues.push('Missing IBAN')
      if (!emp.bank_routing_code) issues.push('Missing Bank Routing Code')
      if (!emp.emirates_id) issues.push('Missing Emirates ID')

      if (issues.length === 0) {
        validItems.push(item)
      } else {
        invalidItems.push({ employee: emp, reason: issues.join(', ') })
      }
    }

    // Generate SIF content
    const lines: string[] = []

    // Calculate totals
    const totalSalary = validItems.reduce((sum, item) => sum + item.net_salary, 0)
    const fixedSalary = validItems.reduce((sum, item) => 
      sum + item.basic_salary + item.housing_allowance + item.transport_allowance + item.other_allowances, 0)
    const variableSalary = validItems.reduce((sum, item) => 
      sum + item.overtime_amount + item.leave_salary - item.deductions, 0)

    // Header Record (HDR) - Company Information
    // Format: HDR,[EmployerCode],[EmployerName],[PeriodStart],[PeriodEnd],[TotalRecords],[TotalAmount],[Currency]
    const employerCode = company.trn || 'UNKNOWN'
    const employerName = company.name.replace(/,/g, ' ').substring(0, 50)
    lines.push(
      `HDR,${employerCode},${employerName},${startDateStr},${endDateStr},${validItems.length},${toDirhams(totalSalary).toFixed(2)},AED`
    )

    // Employee Detail Records (EDR)
    // Format: EDR,[LabourCardNo],[RoutingCode],[IBAN],[StartDate],[EndDate],[Days],[FixedSalary],[VariableSalary],[LeaveIndicator]
    for (const item of validItems) {
      const emp = item.employee
      const labourCard = emp.labour_card_no?.replace(/[^0-9]/g, '') || ''
      const routingCode = emp.bank_routing_code?.replace(/[^0-9]/g, '') || ''
      const iban = emp.iban?.replace(/\s/g, '').toUpperCase() || ''
      const daysPaid = item.days_paid
      const fixed = toDirhams(item.basic_salary + item.housing_allowance + item.transport_allowance + item.other_allowances).toFixed(2)
      const variable = toDirhams(item.overtime_amount + item.leave_salary - item.deductions).toFixed(2)
      const leaveIndicator = '0' // 0 = No leave, 1 = Leave with pay, 2 = Leave without pay

      lines.push(
        `EDR,${labourCard},${routingCode},${iban},${startDateStr},${endDateStr},${daysPaid},${fixed},${variable},${leaveIndicator}`
      )
    }

    // Summary Control Record (SCR)
    // Format: SCR,[TotalRecords],[TotalFixedSalary],[TotalVariableSalary],[TotalNetSalary]
    lines.push(
      `SCR,${validItems.length},${toDirhams(fixedSalary).toFixed(2)},${toDirhams(variableSalary).toFixed(2)},${toDirhams(totalSalary).toFixed(2)}`
    )

    // Generate filename
    const fileName = `WPS_${company.name.replace(/\s+/g, '_')}_${run.run_year}${String(run.run_month).padStart(2, '0')}.sif`

    // Return the SIF file
    const content = lines.join('\n')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('WPS export error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate WPS file' }, { status: 500 })
  }
}

function formatDateForSIF(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}${month}${year}` // DDMMYYYY format
}
