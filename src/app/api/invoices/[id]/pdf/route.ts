import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTRN } from '@/lib/utils'

// Generate FTA-compliant Tax Invoice PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(*),
        items:invoice_items(
          *,
          product:products(*),
          account:accounts(*)
        ),
        company:companies(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    
    // Generate HTML for PDF
    const html = generateFTATaxInvoiceHtml(invoice)
    
    // Return HTML response (in production, convert to PDF using Puppeteer/wkhtmltopdf)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="Invoice_${invoice.invoice_number}.html"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateFTATaxInvoiceHtml(invoice: any): string {
  const company = invoice.company || {}
  const customer = invoice.contact || {}
  const items = invoice.items || []
  
  // VAT breakdown by rate
  const vatBreakdown: Record<number, { taxable: number; vat: number }> = {}
  for (const item of items) {
    const rate = item.vat_rate || 0
    if (!vatBreakdown[rate]) {
      vatBreakdown[rate] = { taxable: 0, vat: 0 }
    }
    vatBreakdown[rate].taxable += item.line_total || 0
    vatBreakdown[rate].vat += item.vat_amount || 0
  }
  
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoice.invoice_number}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }
    .invoice-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px double #1a56db;
    }
    .company-header { flex: 1; }
    .company-name { font-size: 24px; font-weight: 700; color: #1a56db; margin-bottom: 5px; }
    .company-name-ar { font-size: 18px; color: #374151; direction: rtl; margin-bottom: 8px; }
    .company-details { font-size: 10px; color: #6b7280; line-height: 1.6; }
    .trn-badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #1a56db;
      color: #1a56db;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 8px;
    }
    .invoice-title-box { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: 700; color: #047857; letter-spacing: 2px; }
    .invoice-title-ar { font-size: 20px; color: #374151; direction: rtl; margin-top: 5px; }
    .invoice-number { font-size: 14px; color: #6b7280; margin-top: 10px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party-box {
      width: 48%;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #1a56db;
    }
    .party-box.customer { border-left-color: #047857; }
    .party-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .party-name { font-size: 14px; font-weight: 700; margin-bottom: 5px; color: #111827; }
    .party-details { font-size: 10px; color: #6b7280; line-height: 1.6; }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 12px 15px;
      background: #f3f4f6;
      border-radius: 6px;
    }
    .detail-item { text-align: center; }
    .detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; }
    .detail-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .items-table th {
      background: #1a56db;
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .items-table th:last-child { text-align: right; }
    .items-table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tbody tr:nth-child(even) { background: #f9fafb; }
    .item-description { font-weight: 500; color: #111827; }
    .number-cell { text-align: right; font-family: 'Courier New', monospace; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { width: 280px; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-label { color: #6b7280; }
    .totals-value { font-weight: 500; }
    .totals-row.grand-total {
      background: #047857;
      color: white;
      padding: 12px 15px;
      border-radius: 6px;
      border-bottom: none;
      margin-top: 5px;
    }
    .totals-row.grand-total .totals-label,
    .totals-row.grand-total .totals-value { color: white; font-size: 14px; font-weight: 700; }
    .amount-paid { color: #059669; }
    .balance-due { color: #dc2626; font-weight: 700; }
    .vat-summary { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
    .vat-summary-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      color: #374151;
    }
    .vat-table { width: 100%; font-size: 10px; }
    .vat-table td { padding: 5px 0; }
    .vat-table .vat-total { font-weight: 700; border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 5px; }
    .qr-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
    }
    .qr-code {
      width: 150px;
      height: 150px;
      background: white;
      border: 1px solid #e5e7eb;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-placeholder {
      width: 130px;
      height: 130px;
      background: 
        linear-gradient(90deg, #1a1a1a 2px, transparent 2px),
        linear-gradient(#1a1a1a 2px, transparent 2px),
        linear-gradient(90deg, #1a1a1a 1px, transparent 1px),
        linear-gradient(#1a1a1a 1px, transparent 1px);
      background-size: 20px 20px, 20px 20px, 10px 10px, 10px 10px;
      background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
    }
    .qr-label { font-size: 10px; color: #6b7280; }
    .terms-section {
      margin-top: 30px;
      padding: 15px;
      background: #fffbeb;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .terms-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #92400e;
      margin-bottom: 8px;
    }
    .terms-content { font-size: 10px; color: #78350f; line-height: 1.6; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer-text { font-size: 9px; color: #9ca3af; line-height: 1.8; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-container { padding: 0; }
      .items-table th { background: #1a56db !important; }
      .totals-row.grand-total { background: #047857 !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-header">
        <div class="company-name">${company.name || 'Company Name'}</div>
        ${company.name_ar ? `<div class="company-name-ar">${company.name_ar}</div>` : ''}
        <div class="company-details">
          ${company.address || ''}<br>
          ${company.city ? `${company.city}, ` : ''}${company.emirate || ''}, UAE<br>
          ${company.phone ? `Tel: ${company.phone}` : ''}
          ${company.email ? `<br>Email: ${company.email}` : ''}
        </div>
        ${company.trn ? `<div class="trn-badge">TRN: ${formatTRN(company.trn)}</div>` : ''}
      </div>
      <div class="invoice-title-box">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-title-ar">فاتورة ضريبية</div>
        <div class="invoice-number">${invoice.invoice_number}</div>
      </div>
    </div>
    
    <div class="parties">
      <div class="party-box">
        <div class="party-label">From (Supplier)</div>
        <div class="party-name">${company.name || 'Company Name'}</div>
        <div class="party-details">
          ${company.address || ''}<br>
          ${company.city ? `${company.city}, ` : ''}${company.emirate || ''}, UAE<br>
          ${company.trn ? `<strong>TRN:</strong> ${formatTRN(company.trn)}` : ''}
        </div>
      </div>
      <div class="party-box customer">
        <div class="party-label">To (Customer)</div>
        <div class="party-name">${customer.name || 'Customer Name'}</div>
        <div class="party-details">
          ${customer.address || ''}<br>
          ${customer.city ? `${customer.city}, ` : ''}${customer.emirate || ''}<br>
          ${customer.trn ? `<strong>TRN:</strong> ${formatTRN(customer.trn)}<br>` : ''}
        </div>
      </div>
    </div>
    
    <div class="invoice-details">
      <div class="detail-item">
        <div class="detail-label">Invoice Date</div>
        <div class="detail-value">${invoice.invoice_date}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Due Date</div>
        <div class="detail-value">${invoice.due_date}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Payment Terms</div>
        <div class="detail-value">Net ${customer.payment_terms_days || 30} Days</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Reference</div>
        <div class="detail-value">${invoice.reference || '-'}</div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 35%">Description</th>
          <th style="width: 10%" class="number-cell">Qty</th>
          <th style="width: 15%" class="number-cell">Unit Price</th>
          <th style="width: 10%" class="number-cell">VAT %</th>
          <th style="width: 12%" class="number-cell">VAT Amt</th>
          <th style="width: 13%" class="number-cell">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td class="item-description">${item.description}</td>
            <td class="number-cell">${item.quantity}</td>
            <td class="number-cell">${formatCurrency(item.unit_price)}</td>
            <td class="number-cell">${(item.vat_rate || 0) / 100}%</td>
            <td class="number-cell">${formatCurrency(item.vat_amount)}</td>
            <td class="number-cell">${formatCurrency(item.line_total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">VAT (5%)</span>
          <span class="totals-value">${formatCurrency(invoice.vat_total)}</span>
        </div>
        <div class="totals-row grand-total">
          <span class="totals-label">Total Amount</span>
          <span class="totals-value">${formatCurrency(invoice.total)}</span>
        </div>
        ${invoice.amount_paid > 0 ? `
          <div class="totals-row">
            <span class="totals-label">Amount Paid</span>
            <span class="totals-value amount-paid">-${formatCurrency(invoice.amount_paid)}</span>
          </div>
          <div class="totals-row">
            <span class="totals-label">Balance Due</span>
            <span class="totals-value balance-due">${formatCurrency(invoice.total - invoice.amount_paid)}</span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div class="vat-summary">
      <div class="vat-summary-title">VAT Summary</div>
      <table class="vat-table">
        <tbody>
          ${Object.entries(vatBreakdown).map(([rate, data]: [string, any]) => `
            <tr>
              <td>Standard Rated Supplies (${parseInt(rate) / 100}%):</td>
              <td style="text-align: right;">${formatCurrency(data.taxable)}</td>
              <td style="width: 20px;"></td>
              <td>VAT:</td>
              <td style="text-align: right; width: 100px;">${formatCurrency(data.vat)}</td>
            </tr>
          `).join('')}
          <tr class="vat-total">
            <td>Total VAT Amount:</td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: right;">${formatCurrency(invoice.vat_total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="qr-section">
      <div class="qr-code">
        <div class="qr-placeholder"></div>
      </div>
      <div class="qr-label">Scan QR code for FTA e-Invoice verification</div>
    </div>
    
    ${invoice.terms || invoice.notes ? `
      <div class="terms-section">
        ${invoice.notes ? `<div class="terms-title">Notes</div><div class="terms-content">${invoice.notes}</div>` : ''}
        ${invoice.terms ? `<div class="terms-title">Terms & Conditions</div><div class="terms-content">${invoice.terms}</div>` : ''}
      </div>
    ` : ''}
    
    <div class="footer">
      <div class="footer-text">
        This is a computer-generated Tax Invoice compliant with UAE Federal Decree-Law No. 8 of 2017<br>
        ${company.name} ${company.trn ? `| TRN: ${formatTRN(company.trn)}` : ''}
      </div>
    </div>
  </div>
</body>
</html>`
}
