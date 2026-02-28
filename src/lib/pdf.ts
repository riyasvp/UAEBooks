// PDF Generation Utilities for UAE Books
// Generates invoices, reports, and other documents

import { formatCurrency, formatDate, formatTRN, formatIBAN, toDirhams } from "./utils"

// ==================== TYPES ====================

export interface InvoicePdfData {
  invoiceNumber: string
  date: Date
  dueDate: Date
  status: string
  
  company: {
    name: string
    nameAr?: string
    address: string
    addressAr?: string
    trn?: string
    phone?: string
    email?: string
    logo?: string
  }
  
  customer: {
    name: string
    nameAr?: string
    address?: string
    trn?: string
    email?: string
    phone?: string
  }
  
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    discount: number
    vatRate: number
    vatAmount: number
    total: number
  }>
  
  subtotal: number
  discountTotal: number
  vatTotal: number
  grandTotal: number
  amountPaid: number
  balanceDue: number
  
  notes?: string
  terms?: string
}

export interface ReportPdfData {
  title: string
  titleAr?: string
  company: {
    name: string
    nameAr?: string
  }
  period: {
    start: Date
    end: Date
  }
  generatedAt: Date
  currency: string
  
  sections: Array<{
    title: string
    columns: string[]
    rows: Array<Record<string, string | number>>
    totals?: Record<string, number>
  }>
}

// ==================== INVOICE PDF GENERATION ====================

/**
 * Generate HTML for invoice PDF
 * This generates clean HTML that can be converted to PDF
 */
export function generateInvoiceHtml(data: InvoicePdfData): string {
  const {
    invoiceNumber,
    date,
    dueDate,
    company,
    customer,
    items,
    subtotal,
    discountTotal,
    vatTotal,
    grandTotal,
    amountPaid,
    balanceDue,
    notes,
    terms,
  } = data
  
  return `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1a56db;
      margin-bottom: 5px;
    }
    .company-name-ar {
      font-size: 18px;
      color: #666;
      margin-bottom: 10px;
      direction: rtl;
    }
    .company-details {
      font-size: 11px;
      color: #666;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: bold;
      color: #1a56db;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .trn-badge {
      display: inline-block;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      margin-top: 5px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party-box {
      width: 45%;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    .party-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .party-details {
      font-size: 11px;
      color: #666;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f9fafb;
      padding: 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .items-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .items-table .description {
      font-weight: 500;
    }
    .items-table .quantity {
      text-align: center;
      color: #666;
    }
    .totals {
      width: 300px;
      margin-left: auto;
      margin-bottom: 30px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row.total {
      font-weight: bold;
      font-size: 16px;
      border-bottom: 2px solid #1a56db;
      color: #1a56db;
    }
    .totals-row.paid {
      color: #10b981;
    }
    .totals-row.balance {
      font-weight: bold;
      color: #ef4444;
      border-bottom: none;
      padding-top: 12px;
    }
    .notes-section {
      margin-bottom: 30px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 4px;
    }
    .notes-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
    }
    .notes-content {
      font-size: 11px;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    .qr-code {
      width: 100px;
      height: 100px;
      background: #f3f4f6;
      margin: 10px auto;
    }
    .qr-label {
      font-size: 10px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="company-name">${company.name}</div>
      ${company.nameAr ? `<div class="company-name-ar">${company.nameAr}</div>` : ''}
      <div class="company-details">
        ${company.address}<br>
        ${company.phone ? `Tel: ${company.phone}<br>` : ''}
        ${company.email ? `Email: ${company.email}` : ''}
      </div>
      ${company.trn ? `<div class="trn-badge">TRN: ${formatTRN(company.trn)}</div>` : ''}
    </div>
    <div class="invoice-info">
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-number">${invoiceNumber}</div>
      <div style="margin-top: 10px;">
        <strong>Date:</strong> ${formatDate(date)}<br>
        <strong>Due Date:</strong> ${formatDate(dueDate)}
      </div>
    </div>
  </div>
  
  <div class="parties">
    <div class="party-box">
      <div class="party-label">Bill From</div>
      <div class="party-name">${company.name}</div>
      ${company.nameAr ? `<div style="direction: rtl;">${company.nameAr}</div>` : ''}
      <div class="party-details">
        ${company.address}<br>
        ${company.trn ? `TRN: ${formatTRN(company.trn)}` : ''}
      </div>
    </div>
    <div class="party-box">
      <div class="party-label">Bill To</div>
      <div class="party-name">${customer.name}</div>
      ${customer.nameAr ? `<div style="direction: rtl;">${customer.nameAr}</div>` : ''}
      <div class="party-details">
        ${customer.address || ''}<br>
        ${customer.trn ? `TRN: ${formatTRN(customer.trn)}<br>` : ''}
        ${customer.email || ''}<br>
        ${customer.phone || ''}
      </div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40%;">Description</th>
        <th style="width: 10%;">Qty</th>
        <th style="width: 15%;">Unit Price</th>
        <th style="width: 10%;">VAT %</th>
        <th style="width: 10%;">VAT Amt</th>
        <th style="width: 15%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td class="description">${item.description}</td>
          <td class="quantity">${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${item.vatRate / 100}%</td>
          <td>${formatCurrency(item.vatAmount)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${discountTotal > 0 ? `
      <div class="totals-row">
        <span>Discount</span>
        <span>-${formatCurrency(discountTotal)}</span>
      </div>
    ` : ''}
    <div class="totals-row">
      <span>VAT (5%)</span>
      <span>${formatCurrency(vatTotal)}</span>
    </div>
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(grandTotal)}</span>
    </div>
    ${amountPaid > 0 ? `
      <div class="totals-row paid">
        <span>Amount Paid</span>
        <span>-${formatCurrency(amountPaid)}</span>
      </div>
      <div class="totals-row balance">
        <span>Balance Due</span>
        <span>${formatCurrency(balanceDue)}</span>
      </div>
    ` : ''}
  </div>
  
  ${notes ? `
    <div class="notes-section">
      <div class="notes-title">Notes</div>
      <div class="notes-content">${notes}</div>
    </div>
  ` : ''}
  
  ${terms ? `
    <div class="notes-section">
      <div class="notes-title">Terms & Conditions</div>
      <div class="notes-content">${terms}</div>
    </div>
  ` : ''}
  
  <div class="qr-section">
    <div class="qr-code" id="qrcode"></div>
    <div class="qr-label">Scan for FTA ZATCA verification</div>
  </div>
  
  <div class="footer">
    This is a computer generated document. For any queries, please contact ${company.email || 'our support team'}.<br>
    ${company.name} | VAT compliant as per UAE Federal Decree-Law No. 8 of 2017
  </div>
</body>
</html>
  `
}

// ==================== REPORT PDF GENERATION ====================

/**
 * Generate HTML for financial report PDF
 */
export function generateReportHtml(data: ReportPdfData): string {
  const { title, titleAr, company, period, generatedAt, sections } = data
  
  return `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a56db;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .report-title {
      font-size: 18px;
      color: #1a56db;
      margin: 10px 0;
    }
    .report-period {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .generated-info {
      font-size: 9px;
      color: #9ca3af;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: #1a56db;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .data-table th {
      background: #f9fafb;
      padding: 8px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table td {
      padding: 8px;
      border-bottom: 1px solid #f3f4f6;
    }
    .data-table tr:hover {
      background: #f9fafb;
    }
    .data-table .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .data-table .total-row {
      font-weight: bold;
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
      padding: 10px;
      border-top: 1px solid #e5e7eb;
    }
    .page-number:after {
      content: counter(page);
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="company-name">${company.name}</div>
    ${company.nameAr ? `<div style="direction: rtl;">${company.nameAr}</div>` : ''}
    <div class="report-title">${title}</div>
    ${titleAr ? `<div style="direction: rtl; color: #666;">${titleAr}</div>` : ''}
    <div class="report-period">
      Period: ${formatDate(period.start)} to ${formatDate(period.end)}
    </div>
    <div class="generated-info">Generated on ${formatDate(generatedAt)}</div>
  </div>
  
  ${sections.map(section => `
    <div class="section">
      <div class="section-title">${section.title}</div>
      <table class="data-table">
        <thead>
          <tr>
            ${section.columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${section.rows.map((row, idx) => `
            <tr>
              ${Object.values(row).map((val, i) => 
                `<td class="${i === Object.values(row).length - 1 ? 'amount' : ''}">${val}</td>`
              ).join('')}
            </tr>
          `).join('')}
          ${section.totals ? `
            <tr class="total-row">
              ${Object.values(section.totals).map((val, i) => 
                `<td class="${i === Object.values(section.totals).length - 1 ? 'amount' : ''}">${val}</td>`
              ).join('')}
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `).join('')}
  
  <div class="footer">
    ${company.name} | Confidential | Page <span class="page-number"></span>
  </div>
</body>
</html>
  `
}

// ==================== VAT RETURN PDF ====================

export interface VatReturnPdfData {
  company: {
    name: string
    trn: string
  }
  period: {
    start: Date
    end: Date
  }
  boxes: Array<{
    box: string
    label: string
    value: number
    vat?: number
  }>
  netPayable: number
  netRefund: number
}

/**
 * Generate VAT Return (Form 201) PDF
 */
export function generateVatReturnHtml(data: VatReturnPdfData): string {
  return `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>VAT Return - Form 201</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
    }
    .form-header {
      text-align: center;
      margin-bottom: 30px;
      border: 2px solid #1a56db;
      padding: 20px;
    }
    .form-title {
      font-size: 20px;
      font-weight: bold;
      color: #1a56db;
    }
    .form-subtitle {
      font-size: 12px;
      color: #666;
    }
    .taxpayer-info {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9fafb;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      width: 150px;
      font-weight: bold;
    }
    .box-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .box-table th {
      background: #1a56db;
      color: white;
      padding: 10px;
      text-align: left;
    }
    .box-table td {
      padding: 10px;
      border: 1px solid #e5e7eb;
    }
    .box-number {
      width: 60px;
      font-weight: bold;
      text-align: center;
      background: #f3f4f6;
    }
    .box-value {
      text-align: right;
      width: 150px;
      font-family: 'Courier New', monospace;
    }
    .total-row {
      background: #f9fafb;
      font-weight: bold;
    }
    .declaration {
      margin-top: 30px;
      padding: 20px;
      border: 1px solid #e5e7eb;
    }
    .signature-area {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="form-header">
    <div class="form-title">VAT RETURN</div>
    <div class="form-subtitle">Form 201 - Federal Tax Authority</div>
    <div style="margin-top: 10px;">United Arab Emirates</div>
  </div>
  
  <div class="taxpayer-info">
    <div class="info-row">
      <span class="info-label">Taxpayer Name:</span>
      <span>${data.company.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">TRN:</span>
      <span>${formatTRN(data.company.trn)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tax Period:</span>
      <span>${formatDate(data.period.start)} to ${formatDate(data.period.end)}</span>
    </div>
  </div>
  
  <h3>Sales (Output VAT)</h3>
  <table class="box-table">
    <thead>
      <tr>
        <th>Box</th>
        <th>Description</th>
        <th>Value (AED)</th>
        <th>VAT (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${data.boxes.filter(b => ['1', '1A', '2', '3', '4'].includes(b.box)).map(box => `
        <tr class="${box.box === '4' ? 'total-row' : ''}">
          <td class="box-number">${box.box}</td>
          <td>${box.label}</td>
          <td class="box-value">${formatCurrency(box.value)}</td>
          <td class="box-value">${box.vat !== undefined ? formatCurrency(box.vat) : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h3>Purchases (Input VAT)</h3>
  <table class="box-table">
    <thead>
      <tr>
        <th>Box</th>
        <th>Description</th>
        <th>Value (AED)</th>
        <th>VAT (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${data.boxes.filter(b => ['5', '5A', '6', '6A', '7'].includes(b.box)).map(box => `
        <tr class="${box.box === '7' ? 'total-row' : ''}">
          <td class="box-number">${box.box}</td>
          <td>${box.label}</td>
          <td class="box-value">${formatCurrency(box.value)}</td>
          <td class="box-value">${box.vat !== undefined ? formatCurrency(box.vat) : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h3>Net VAT</h3>
  <table class="box-table">
    <thead>
      <tr>
        <th>Box</th>
        <th>Description</th>
        <th>Amount (AED)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="box-number">8</td>
        <td>VAT Refundable</td>
        <td class="box-value">${formatCurrency(data.netRefund)}</td>
      </tr>
      <tr>
        <td class="box-number">9</td>
        <td>VAT Payable</td>
        <td class="box-value">${formatCurrency(data.netPayable)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="declaration">
    <strong>Declaration</strong>
    <p>
      I declare that the information provided in this return is true and correct to the best of my knowledge and belief.
      I understand that providing false information is an offence under Federal Decree-Law No. 8 of 2017.
    </p>
  </div>
  
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">Authorized Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Date</div>
    </div>
  </div>
</body>
</html>
  `
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get base64 encoded PDF from HTML
 * Note: In production, use a proper PDF library like Puppeteer or wkhtmltopdf
 */
export function htmlToPdfBase64(html: string): string {
  // This is a placeholder - in production, convert HTML to actual PDF
  // For now, return the HTML as base64 for demonstration
  return Buffer.from(html).toString('base64')
}

/**
 * Generate filename for invoice PDF
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `Invoice_${invoiceNumber}_${new Date().toISOString().slice(0, 10)}.pdf`
}

/**
 * Generate filename for report PDF
 */
export function generateReportFilename(reportType: string, period: string): string {
  return `${reportType}_${period}_${new Date().toISOString().slice(0, 10)}.pdf`
}
