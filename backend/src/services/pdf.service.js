import PDFDocument from "pdfkit";

export async function generateInvoicePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const vendor = (data.vendor && typeof data.vendor === "object") ? data.vendor : {};
    const po = (data.purchaseOrder && typeof data.purchaseOrder === "object") ? data.purchaseOrder : {};
    const rfq = (po.rfq && typeof po.rfq === "object") ? po.rfq : (po.rfqId && typeof po.rfqId === "object") ? po.rfqId : {};
    const items = Array.isArray(po.items) ? po.items : [];

    // Color Palette
    const primaryColor = "#1e40af";   // Deep Indigo Blue
    const darkTextColor = "#0f172a";  // Slate 900
    const mutedTextColor = "#475569"; // Slate 600
    const lightBgColor = "#f8fafc";   // Slate 50
    const borderColor = "#e2e8f0";    // Slate 200

    // Top Brand Color Bar
    doc.rect(40, 40, 515, 4).fill(primaryColor);

    // --- Header Branding ---
    doc
      .fontSize(22)
      .fillColor(primaryColor)
      .text("VendorBridge", 40, 55, { font: "Helvetica-Bold" })
      .fontSize(9)
      .fillColor(mutedTextColor)
      .text("Vendor Management System", 40, 80, { font: "Helvetica" });

    // Right-aligned TAX INVOICE Title & Metadata Box (Single text strings per line to prevent overlapping)
    doc
      .fontSize(20)
      .fillColor(darkTextColor)
      .text("TAX INVOICE", 350, 55, { width: 205, align: "right", font: "Helvetica-Bold" })
      .fontSize(9)
      .fillColor(darkTextColor)
      .text(`Invoice No: ${data.invoiceNumber || "N/A"}`, 350, 80, { width: 205, align: "right", font: "Helvetica-Bold" })
      .fillColor(mutedTextColor)
      .text(`Date: ${data.issuedAt ? new Date(data.issuedAt).toLocaleDateString("en-IN") : "N/A"}`, 350, 95, { width: 205, align: "right", font: "Helvetica" })
      .fillColor("#059669")
      .text(`Status: ${data.status || "GENERATED"}`, 350, 110, { width: 205, align: "right", font: "Helvetica-Bold" });

    doc.moveTo(40, 130).lineTo(555, 130).strokeColor(borderColor).lineWidth(1).stroke();

    // --- 2-Column Info Section ---
    const infoY = 142;

    // Left Column: Vendor Details
    doc
      .fontSize(11)
      .fillColor(primaryColor)
      .text("VENDOR DETAILS (ISSUED BY)", 40, infoY, { font: "Helvetica-Bold" });

    doc
      .fontSize(9)
      .fillColor(darkTextColor)
      .text(vendor.companyName || vendor.vendorName || "N/A", 40, infoY + 16, { font: "Helvetica-Bold" })
      .fillColor(mutedTextColor)
      .text(`Contact: ${vendor.contactPerson || "N/A"}`, 40, infoY + 30)
      .text(`Email: ${vendor.email || "N/A"}`, 40, infoY + 43)
      .text(`Phone: ${vendor.phone || "N/A"}`, 40, infoY + 56);
    if (vendor.gstNumber) {
      doc.text(`GSTIN: ${vendor.gstNumber}`, 40, infoY + 69);
    }
    if (vendor.address) {
      doc.text(`Address: ${vendor.address}`, 40, vendor.gstNumber ? infoY + 82 : infoY + 69, { width: 230 });
    }

    // Right Column: Order References
    doc
      .fontSize(11)
      .fillColor(primaryColor)
      .text("ORDER & PO REFERENCE", 320, infoY, { font: "Helvetica-Bold" });

    doc
      .fontSize(9)
      .fillColor(darkTextColor)
      .text(`PO Number: ${po.poNumber || "N/A"}`, 320, infoY + 16, { font: "Helvetica-Bold" })
      .fillColor(mutedTextColor)
      .text(`RFQ Reference: ${rfq.rfqNumber || "N/A"}`, 320, infoY + 30, { font: "Helvetica" })
      .text(`RFQ Title: ${rfq.title || "N/A"}`, 320, infoY + 43, { font: "Helvetica" });

    // --- Items Table ---
    const tableHeaderY = 245;
    doc.moveTo(40, tableHeaderY - 10).lineTo(555, tableHeaderY - 10).strokeColor(borderColor).stroke();

    // Table Header Background Bar
    doc
      .rect(40, tableHeaderY, 515, 22)
      .fill(primaryColor);

    doc
      .fontSize(9)
      .fillColor("#ffffff")
      .text("#", 48, tableHeaderY + 6, { font: "Helvetica-Bold", width: 20 })
      .text("ITEM DESCRIPTION", 70, tableHeaderY + 6, { font: "Helvetica-Bold", width: 200 })
      .text("QTY", 270, tableHeaderY + 6, { font: "Helvetica-Bold", width: 40, align: "right" })
      .text("UNIT PRICE", 320, tableHeaderY + 6, { font: "Helvetica-Bold", width: 80, align: "right" })
      .text("TAX %", 410, tableHeaderY + 6, { font: "Helvetica-Bold", width: 45, align: "right" })
      .text("TOTAL AMOUNT", 460, tableHeaderY + 6, { font: "Helvetica-Bold", width: 90, align: "right" });

    let currentY = tableHeaderY + 22;

    if (items.length === 0) {
      doc
        .rect(40, currentY, 515, 22)
        .fill(lightBgColor);
      doc
        .fontSize(9)
        .fillColor(darkTextColor)
        .text("1", 48, currentY + 6)
        .text(rfq.title || "Procurement Service / Goods", 70, currentY + 6)
        .text("1", 270, currentY + 6, { width: 40, align: "right" })
        .text(`Rs. ${Number(data.subtotal || 0).toFixed(2)}`, 320, currentY + 6, { width: 80, align: "right" })
        .text(`${Number(data.taxAmount > 0 ? (data.taxAmount / data.subtotal * 100) : 0).toFixed(0)}%`, 410, currentY + 6, { width: 45, align: "right" })
        .text(`Rs. ${Number(data.grandTotal || 0).toFixed(2)}`, 460, currentY + 6, { width: 90, align: "right" });
      currentY += 22;
    } else {
      items.forEach((item, index) => {
        const bg = index % 2 === 0 ? "#ffffff" : lightBgColor;
        doc.rect(40, currentY, 515, 22).fill(bg);
        doc
          .fontSize(9)
          .fillColor(darkTextColor)
          .text((index + 1).toString(), 48, currentY + 6, { width: 20 })
          .text(item.itemName || "Item", 70, currentY + 6, { width: 200, height: 16 })
          .text((item.quantity || 1).toString(), 270, currentY + 6, { width: 40, align: "right" })
          .text(`Rs. ${Number(item.unitPrice || 0).toFixed(2)}`, 320, currentY + 6, { width: 80, align: "right" })
          .text(`${item.taxPercentage || 0}%`, 410, currentY + 6, { width: 45, align: "right" })
          .text(`Rs. ${Number(item.totalAmount || 0).toFixed(2)}`, 460, currentY + 6, { width: 90, align: "right" });
        currentY += 22;
      });
    }

    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor(borderColor).stroke();
    currentY += 15;

    // --- Financial Summary Section ---
    const summaryX = 335;

    doc
      .fontSize(9)
      .fillColor(mutedTextColor)
      .text("Subtotal:", summaryX, currentY, { width: 100 })
      .fillColor(darkTextColor)
      .text(`Rs. ${Number(data.subtotal || 0).toFixed(2)}`, summaryX + 100, currentY, { width: 120, align: "right", font: "Helvetica-Bold" });

    currentY += 16;
    doc
      .fillColor(mutedTextColor)
      .text("Tax Amount:", summaryX, currentY, { width: 100 })
      .fillColor(darkTextColor)
      .text(`Rs. ${Number(data.taxAmount || 0).toFixed(2)}`, summaryX + 100, currentY, { width: 120, align: "right", font: "Helvetica-Bold" });

    currentY += 20;

    // Grand Total Highlight Box
    doc
      .roundedRect(summaryX - 10, currentY - 4, 240, 32, 6)
      .fill("#eff6ff");

    doc
      .fontSize(11)
      .fillColor(primaryColor)
      .text("Grand Total:", summaryX, currentY + 3, { width: 100, font: "Helvetica-Bold" })
      .text(`Rs. ${Number(data.grandTotal || 0).toFixed(2)}`, summaryX + 90, currentY + 3, { width: 130, align: "right", font: "Helvetica-Bold" });

    // --- Footer ---
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text("This is an official computer-generated invoice issued via VendorBridge Vendor Management System.", 40, 740, { align: "center" })
      .text("Thank you for your business!", 40, 752, { align: "center" });

    doc.end();
  });
}

export async function generatePOPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const vendor = (data.vendor && typeof data.vendor === "object") ? data.vendor : {};
    const rfq = (data.rfq && typeof data.rfq === "object") ? data.rfq : {};
    const items = Array.isArray(data.items) ? data.items : [];

    const primaryColor = "#1e40af";
    const darkTextColor = "#0f172a";
    const mutedTextColor = "#475569";
    const lightBgColor = "#f8fafc";
    const borderColor = "#e2e8f0";

    // Top Brand Color Bar
    doc.rect(40, 40, 515, 4).fill(primaryColor);

    // Header Branding
    doc
      .fontSize(22)
      .fillColor(primaryColor)
      .text("VendorBridge", 40, 55, { font: "Helvetica-Bold" })
      .fontSize(9)
      .fillColor(mutedTextColor)
      .text("Vendor Management System", 40, 80, { font: "Helvetica" });

    doc
      .fontSize(20)
      .fillColor(darkTextColor)
      .text("PURCHASE ORDER", 350, 55, { width: 205, align: "right", font: "Helvetica-Bold" })
      .fontSize(9)
      .fillColor(darkTextColor)
      .text(`PO No: ${data.poNumber || "N/A"}`, 350, 80, { width: 205, align: "right", font: "Helvetica-Bold" })
      .fillColor(mutedTextColor)
      .text(`Date: ${data.issueDate ? new Date(data.issueDate).toLocaleDateString("en-IN") : "N/A"}`, 350, 95, { width: 205, align: "right", font: "Helvetica" });

    doc.moveTo(40, 125).lineTo(555, 125).strokeColor(borderColor).stroke();

    // Vendor & RFQ info
    doc
      .fontSize(10)
      .fillColor(darkTextColor)
      .text(`Vendor: ${vendor.companyName || vendor.vendorName || "N/A"} (${vendor.email || "N/A"})`, 40, 140, { font: "Helvetica-Bold" })
      .fillColor(mutedTextColor)
      .text(`RFQ Reference: ${rfq.rfqNumber || "N/A"} — ${rfq.title || "N/A"}`, 40, 155, { font: "Helvetica" });

    // Items Table Header
    const tableY = 185;
    doc
      .rect(40, tableY, 515, 22)
      .fill(primaryColor);

    doc
      .fontSize(9)
      .fillColor("#ffffff")
      .text("Item Description", 55, tableY + 6, { font: "Helvetica-Bold", width: 220 })
      .text("Qty", 280, tableY + 6, { font: "Helvetica-Bold", width: 40, align: "right" })
      .text("Unit Price", 330, tableY + 6, { font: "Helvetica-Bold", width: 80, align: "right" })
      .text("Tax %", 420, tableY + 6, { font: "Helvetica-Bold", width: 45, align: "right" })
      .text("Total Amount", 475, tableY + 6, { font: "Helvetica-Bold", width: 75, align: "right" });

    let rowY = tableY + 22;
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : lightBgColor;
      doc.rect(40, rowY, 515, 22).fill(bg);
      doc
        .fontSize(9)
        .fillColor(darkTextColor)
        .text(item.itemName || "Item", 55, rowY + 6, { width: 220 })
        .text((item.quantity || 1).toString(), 280, rowY + 6, { width: 40, align: "right" })
        .text(`Rs. ${Number(item.unitPrice || 0).toFixed(2)}`, 330, rowY + 6, { width: 80, align: "right" })
        .text(`${item.taxPercentage || 0}%`, 420, rowY + 6, { width: 45, align: "right" })
        .text(`Rs. ${Number(item.totalAmount || 0).toFixed(2)}`, 475, rowY + 6, { width: 75, align: "right" });
      rowY += 22;
    });

    doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor(borderColor).stroke();

    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text("Authorized Purchase Order issued by VendorBridge.", 40, 740, { align: "center" });

    doc.end();
  });
}
