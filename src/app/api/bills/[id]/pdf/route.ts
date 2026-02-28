import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTRN } from '@/lib/utils'

// Generate Bill PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: bill, error } = await supabase
      .from('bills')
      .select(`
        *,
        contact:contacts(*),
        items:bill_items(*),
        company:companies(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error || !bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }
    
    const html = generateBillPdfHtml(bill)
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="Bill_${bill.bill_number}.html"`,
      },
    })
  } catch (error) {
    console.error('Bill PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateBillPdfHtml(bill: any): string {
  const company = bill.company || {}
  const supplier = bill.contact || {}
  const items = bill.items || []
  
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Bill - ${bill.bill_number}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; line-height: 1.5; color: #1a1a1a; }
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px double #7c3aed; }
    .company-name { font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 5px; }
    .company-details { font-size: 10px; color: #6b7280; line-height: 1.6; }
    .trn-badge { display: inline-block; background: #f5f3ff; border: 1px solid #7c3aed; color: #7c3aed; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-top: 8px; }
    .bill-title { font-size: 28px; font-weight: 700; color: #6d28d9; }
    .bill-number { font-size: 14px; color: #6b7280; margin-top: 10px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party-box { width: 48%; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #7c3aed; }
    .party-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 600; }
    .party-name { font-size: 14px; font-weight: 700; margin-bottom: 5px; color: #111827; }
    .party-details { font-size: 10px; color: #6b7280; line-height: 1.6; }
    .details { display: flex; justify-content: space-between; margin-bottom: 25px; padding: 12px 15px; background: #f3f4f6; border-radius: 6px; }
    .detail-item { text-align: center; }
    .detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; }
    .detail-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .items-table th { background: #7c3aed; color: white; padding: 12px 10px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 600; }
    .items-table th:last-child { text-align: right; }
    .items-table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tbody tr:nth-child(even) { background: #f9fafb; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .totals-row.grand-total { background: #6d28d9; color: white; padding: 12px 15px; border-radius: 6px; border-bottom: none; margin-top: 5px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer-text { font-size: 9px; color: #9ca3af; line-height: 1.8; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; } .items-table th { background: #7c3aed !important; } .totals-row.grand-total { background: #6d28d9 !important; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="company-name">${company.name || 'Company Name'}</div>
        <div class="company-details">
          ${company.address || ''}<br>
          ${company.city ? `${company.city}, ` : ''}${company.emirate || ''}, UAE<br>
          ${company.phone ? `Tel: ${company.phone}` : ''}
        </div>
        ${company.trn ? `<div class="trn-badge">TRN: ${formatTRN(company.trn)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="bill-title">BILL</div>
        <div class="bill-number">${bill.bill_number}</div>
      </div>
    </div>
    
    <div class="parties">
      <div class="party-box">
        <div class="party-label">Supplier</div>
        <div class="party-name">${supplier.name || 'Supplier'}</div>
        <div class="party-details">
          ${supplier.address || ''}<br>
          ${supplier.city ? `${supplier.city}, ` : ''}${supplier.emirate || ''}<br>
          ${supplier.trn ? `<strong>TRN:</strong> ${formatTRN(supplier.trn)}` : ''}
        </div>
      </div>
      <div class="party-box" style="border-left-color: #6d28d9;">
        <div class="party-label">Bill To</div>
        <div class="party-name">${company.name || 'Company Name'}</div>
        <div class="party-details">
          ${company.address || ''}<br>
          ${company.trn ? `<strong>TRN:</strong> ${formatTRN(company.trn)}` : ''}
        </div>
      </div>
    </div>
    
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Bill Date</div>
        <div class="detail-value">${bill.bill_date}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Due Date</div>
        <div class="detail-value">${bill.due_date}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Supplier Ref</div>
        <div class="detail-value">${bill.supplier_reference || '-'}</div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">VAT</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.description}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="text-align: right;">${formatCurrency(item.vat_amount)}</td>
            <td style="text-align: right;">${formatCurrency(item.line_total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(bill.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>VAT (5%)</span>
          <span>${formatCurrency(bill.vat_total)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total</span>
          <span>${formatCurrency(bill.total)}</span>
        </div>
        ${bill.amount_paid > 0 ? `
          <div class="totals-row">
            <span>Amount Paid</span>
            <span style="color: #059669;">-${formatCurrency(bill.amount_paid)}</span>
          </div>
          <div class="totals-row">
            <span>Balance Due</span>
            <span style="color: #dc2626; font-weight: 700;">${formatCurrency(bill.total - bill.amount_paid)}</span>
          </div>
        ` : ''}
      </div>
    </div>
    
    ${bill.notes ? `
      <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; color: #374151;">Notes</div>
        <div style="font-size: 10px; color: #6b7280;">${bill.notes}</div>
      </div>
    ` : ''}
    
    <div class="footer">
      <div class="footer-text">${company.name} | Internal Document</div>
    </div>
  </div>
</body>
</html>`
}
