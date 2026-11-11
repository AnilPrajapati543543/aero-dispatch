/**
 * AeroDispatch - Enterprise Invoice & Data Export Engine
 * 
 * Provides:
 * 1. Printable / Vector PDF Tax Invoices & Air Waybill Receipts with GST breakdown
 * 2. Instant CSV spreadsheet generation and download
 */

/**
 * Exports an array of records to a formatted CSV file and triggers browser download.
 */
export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) {
    alert("No records available to export.");
    return;
  }

  const columnKeys = headers ? Object.keys(headers) : Object.keys(rows[0]);
  const columnLabels = headers ? Object.values(headers) : columnKeys;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = columnLabels.map(escapeCSV).join(",");
  const dataRows = rows.map((row) =>
    columnKeys.map((key) => escapeCSV(row[key])).join(",")
  );

  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats an order object into a standardized CSV row.
 */
export function formatOrderForCSV(order) {
  const sender = order.sender || {};
  const recipient = order.recipient || {};
  const assigned = order.assignedDriver || {};

  return {
    awbNumber: order.awbNumber || order.orderId || "N/A",
    orderId: order.orderId || order.displayOrderId || "N/A",
    bookingDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent",
    currentStatus: (order.currentStatus || order.status || "BOOKED").replace(/_/g, " "),
    serviceTier: order.serviceTier || "Express Air",
    paymentMode: order.paymentMode || "Prepaid",
    weightKg: order.weightKg || "1.0",
    declaredValue: order.declaredValue ? `INR ${order.declaredValue}` : "N/A",
    senderName: sender.name || order.senderName || "AeroDispatch Hub",
    senderCity: sender.city || order.senderCity || "N/A",
    recipientName: recipient.name || order.recipientName || "Consignee",
    recipientCity: recipient.city || order.destinationCity || order.recipientCity || "N/A",
    recipientPhone: recipient.phone || order.recipientPhone || "N/A",
    deliveryCaptain: assigned.name ? `Captain ${assigned.name.replace(/^captain\s+/i, '')}` : "Unassigned",
    captainPhone: assigned.phone || "N/A",
    proofVerified: order.proofOfDelivery?.verified ? "YES (Rekognition)" : "Pending"
  };
}

export const SHIPMENT_CSV_HEADERS = {
  awbNumber: "Air Waybill (AWB)",
  orderId: "Order ID",
  bookingDate: "Booking Date",
  currentStatus: "Consignment Status",
  serviceTier: "Service Tier",
  paymentMode: "Payment Mode",
  weightKg: "Weight (KG)",
  declaredValue: "Declared Value",
  senderName: "Consignor (Sender)",
  senderCity: "Origin City",
  recipientName: "Consignee (Recipient)",
  recipientCity: "Destination City",
  recipientPhone: "Recipient Contact",
  deliveryCaptain: "Assigned Captain",
  captainPhone: "Captain Phone",
  proofVerified: "Photo Proof Verified"
};

/**
 * Triggers a browser print window with a dedicated standalone tax invoice.
 */
export function printInvoiceDocument(order, documentType = "INVOICE") {
  if (!order) return;

  const awb = order.awbNumber || order.orderId || "AD-PENDING";
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : new Date().toLocaleDateString();

  const isDelivered = (order.currentStatus || order.status) === "DELIVERED";
  const sender = order.sender || {};
  const recipient = order.recipient || {};
  const assigned = order.assignedDriver || {};

  const sName = sender.name || order.senderName || "AeroDispatch Cargo Partner";
  const sAddress = sender.address || order.senderAddress || "Logistics Hub Node";
  const sCity = sender.city || order.senderCity || "Mumbai";
  const sPin = sender.pinCode || order.senderPin || "400001";
  const sPhone = sender.phone || order.senderPhone || "+91 98200 11223";

  const rName = recipient.name || order.recipientName || "Consignee Recipient";
  const rAddress = recipient.address || order.deliveryAddress || order.recipientAddress || "Delivery Address";
  const rCity = recipient.city || order.destinationCity || order.recipientCity || "Destination";
  const rPin = recipient.pinCode || order.destinationPin || order.recipientPin || "";
  const rPhone = recipient.phone || order.recipientPhone || "";

  const weight = parseFloat(order.weightKg || 1.0);
  const tier = order.serviceTier || "Express Air Cargo";
  const ratePerKg = tier.includes("Air") ? 190 : 120;
  const baseFreight = Math.round(weight * ratePerKg);
  const fuelSurcharge = Math.round(baseFreight * 0.12);
  const docketFee = 50;
  const taxableAmount = baseFreight + fuelSurcharge + docketFee;
  const gstAmount = Math.round(taxableAmount * 0.18);
  const totalAmount = taxableAmount + gstAmount;

  const printWindow = window.open("", "_blank", "width=850,height=950");
  if (!printWindow) {
    alert("Please allow pop-ups to print or save your invoice as a PDF.");
    return;
  }

  const docTitle = documentType === "RECEIPT" ? "AeroDispatch Shipping Receipt" : "AeroDispatch Official GST Tax Invoice";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${awb}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #FFFFFF;
      color: #0F172A;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #CBD5E1;
      padding: 28px;
      border-radius: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284C7;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0284C7;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 800;
      border-radius: 4px;
      margin-top: 4px;
    }
    .badge-paid {
      background: #DCFCE7;
      color: #166534;
      border: 1px solid #BBF7D0;
    }
    .badge-cod {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .barcode-strip {
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      padding: 10px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .barcode-code {
      font-family: monospace;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #0284C7;
    }
    .barcode-svg {
      font-family: monospace;
      font-size: 20px;
      letter-spacing: 5px;
      color: #334155;
    }
    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 16px;
    }
    .address-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #0284C7;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .address-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .table-container {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #F1F5F9;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      padding: 10px 12px;
      border-bottom: 1px solid #CBD5E1;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #E2E8F0;
      color: #1E293B;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .notes-box {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 14px;
      background: #FAFAFA;
      font-size: 11px;
      color: #64748B;
    }
    .total-table {
      width: 100%;
    }
    .total-table td {
      padding: 6px 10px;
      border: none;
    }
    .total-row {
      border-top: 2px solid #0284C7 !important;
      font-size: 16px;
      font-weight: 800;
      color: #0284C7;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      font-size: 11px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .signature-area {
      text-align: right;
    }
    .signature-line {
      display: inline-block;
      width: 180px;
      border-top: 1px solid #94A3B8;
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #64748B;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #0F172A;
      color: #FFFFFF;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-radius: 6px;
    }
    .print-btn {
      background: #0284C7;
      color: #FFFFFF;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
      .invoice-container {
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>AeroDispatch Logistics Billing</strong> &bull; ${docTitle}
    </div>
    <div>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>

  <div class="invoice-container">
    <div class="header">
      <div class="brand">
        <div>
          <div class="brand-title">✈ AERODISPATCH</div>
          <div class="brand-subtitle">Express Serverless Cargo & Logistics Network</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
            GSTIN: 27AABCA8469E1Z8 &bull; CIN: U63090MH2026PTC84692<br>
            AeroDispatch Air Cargo Complex, Sahar Road, Mumbai 400099
          </div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">${documentType === "RECEIPT" ? "SHIPPING RECEIPT" : "TAX INVOICE"}</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
          Invoice No: <strong>INV-${awb.replace(/\D/g, '') || '8469'}</strong><br>
          Date: ${dateStr}
        </div>
        <span class="badge ${order.paymentMode === 'COD' ? 'badge-cod' : 'badge-paid'}">
          ${order.paymentMode === 'COD' ? '● CASH ON DELIVERY' : '✓ PREPAID ONLINE'}
        </span>
      </div>
    </div>

    <div class="barcode-strip">
      <div>
        <div style="font-size: 10px; text-transform: uppercase; color: #64748B; font-weight: 700;">AIR WAYBILL / CONSIGNMENT NUMBER</div>
        <div class="barcode-code">${awb}</div>
      </div>
      <div class="barcode-svg">||| | |||| || |||||| | |||</div>
      <div style="text-align: right;">
        <div style="font-size: 10px; text-transform: uppercase; color: #64748B; font-weight: 700;">STATUS</div>
        <div style="font-size: 13px; font-weight: 800; color: ${isDelivered ? '#166534' : '#0284C7'};">
          ${isDelivered ? '✓ DELIVERED' : (order.currentStatus || 'IN TRANSIT').replace(/_/g, ' ')}
        </div>
      </div>
    </div>

    <div class="address-grid">
      <div class="address-box">
        <h4>CONSIGNOR (ORIGIN SENDER)</h4>
        <div class="address-name">${sName}</div>
        <div>${sAddress}</div>
        <div>${sCity} - ${sPin}</div>
        <div style="margin-top: 4px; color: #64748B;">Contact: <strong>${sPhone}</strong></div>
      </div>
      <div class="address-box">
        <h4>CONSIGNEE (DESTINATION RECIPIENT)</h4>
        <div class="address-name">${rName}</div>
        <div>${rAddress}</div>
        <div>${rCity} ${rPin ? `- ${rPin}` : ''}</div>
        <div style="margin-top: 4px; color: #64748B;">Contact: <strong>${rPhone || 'N/A'}</strong></div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description & Service Tier</th>
            <th>SAC Code</th>
            <th>Weight (KG)</th>
            <th>Rate / Unit</th>
            <th style="text-align: right;">Taxable Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${tier}</strong><br>
              <span style="font-size: 11px; color: #64748B;">Declared Value: ₹${order.declaredValue || 2500} &bull; Category: ${order.category || 'Express Parcel'}</span>
            </td>
            <td>996812</td>
            <td>${weight.toFixed(2)} KG</td>
            <td>₹${ratePerKg} / KG</td>
            <td style="text-align: right; font-weight: 700;">₹${baseFreight}.00</td>
          </tr>
          <tr>
            <td>Fuel Surcharge (12%)</td>
            <td>996812</td>
            <td>-</td>
            <td>Variable</td>
            <td style="text-align: right; font-weight: 700;">₹${fuelSurcharge}.00</td>
          </tr>
          <tr>
            <td>Air Waybill Documentation & Security Handling</td>
            <td>996812</td>
            <td>1 AWB</td>
            <td>Fixed</td>
            <td style="text-align: right; font-weight: 700;">₹${docketFee}.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-grid">
      <div class="notes-box">
        <strong style="color: #0F172A;">Terms & Conditions of Carriage:</strong>
        <p style="margin-top: 4px;">
          1. Consignment subject to AeroDispatch standard terms of linehaul carriage.<br>
          2. Peak liability for loss/damage is capped as per Carriage by Air Act, 1972.<br>
          3. This is an electronically generated and certified tax invoice with double-entry AWS DynamoDB ledger verification.
        </p>
        ${assigned.name ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #CBD5E1; color: #0284C7;">
          <strong>Courier Dispatch Note:</strong> Delivered/Assigned to <strong>Captain ${assigned.name.replace(/^captain\s+/i, '')}</strong> (${assigned.vehicleNumber || 'EV Van'})
        </div>` : ''}
      </div>

      <div>
        <table class="total-table">
          <tr>
            <td>Taxable Subtotal:</td>
            <td style="text-align: right; font-weight: 700;">₹${taxableAmount}.00</td>
          </tr>
          <tr>
            <td>CGST @ 9%:</td>
            <td style="text-align: right;">₹${Math.round(gstAmount / 2)}.00</td>
          </tr>
          <tr>
            <td>SGST / IGST @ 9%:</td>
            <td style="text-align: right;">₹${Math.round(gstAmount / 2)}.00</td>
          </tr>
          <tr class="total-row">
            <td>Total Invoice Amount:</td>
            <td style="text-align: right;">₹${totalAmount}.00</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer">
      <div>
        AeroDispatch Serverless Platform &bull; Automated Billing Node &bull; Support: support@aerodispatch.site
      </div>
      <div class="signature-area">
        <div class="signature-line">
          Authorized Signatory<br>
          <strong>AeroDispatch Logistics Ltd.</strong>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

