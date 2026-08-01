import { Router } from "express";
import { Invoice } from "../models/Invoice.js";
import { Vendor } from "../models/Vendor.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import { generateInvoicePDF } from "../services/pdf.service.js";
import { sendInvoiceEmail } from "../services/email.service.js";

const router = Router();

const INVOICE_STATUSES = ["GENERATED", "SENT", "PAID", "OVERDUE", "CANCELLED"];

function shapeInvoice(doc) {
  const obj = typeof doc.toJSON === "function" ? doc.toJSON() : { ...doc };
  const vendor = (obj.vendor && typeof obj.vendor === "object") ? obj.vendor : (obj.vendorId && typeof obj.vendorId === "object") ? obj.vendorId : null;
  const po = (obj.purchaseOrder && typeof obj.purchaseOrder === "object") ? obj.purchaseOrder : (obj.poId && typeof obj.poId === "object") ? obj.poId : null;

  if (vendor) {
    obj.vendor = vendor;
    obj.vendorId = vendor;
  }
  if (po) {
    obj.purchaseOrder = po;
    obj.poId = po;
    const rfq = (po.rfq && typeof po.rfq === "object") ? po.rfq : (po.rfqId && typeof po.rfqId === "object") ? po.rfqId : null;
    if (rfq) {
      po.rfq = rfq;
      po.rfqId = rfq;
    }
  }
  return obj;
}

// GET /api/invoices
router.get("/", authenticateJWT, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.json({ success: true, data: [] }); return; }
      query = { $or: [{ vendorId: vendor._id }, { vendor: vendor._id }] };
    }

    const invoices = await Invoice.find(query)
      .populate("vendorId")
      .populate("vendor")
      .populate({ path: "poId", populate: [{ path: "rfqId" }, { path: "rfq" }] })
      .populate({ path: "purchaseOrder", populate: [{ path: "rfqId" }, { path: "rfq" }] })
      .sort({ issuedAt: -1 });

    res.json({ success: true, data: invoices.map((i) => shapeInvoice(i.toJSON())) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch invoices" });
  }
});

// GET /api/invoices/:id
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("vendorId")
      .populate("vendor")
      .populate({ path: "poId", populate: [{ path: "rfqId" }, { path: "rfq" }, { path: "items" }] })
      .populate({ path: "purchaseOrder", populate: [{ path: "rfqId" }, { path: "rfq" }, { path: "items" }] });

    if (!invoice) { res.status(404).json({ success: false, error: "Invoice not found" }); return; }

    const shaped = shapeInvoice(invoice.toJSON());

    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      const vendorIdStr = shaped.vendor?._id?.toString() || shaped.vendor?.id || "";
      if (!vendor || vendorIdStr !== vendor._id.toString()) {
        res.status(403).json({ success: false, error: "Access denied" }); return;
      }
    }

    res.json({ success: true, data: shaped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch invoice" });
  }
});

// PUT /api/invoices/:id/status
router.put(
  "/:id/status",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!INVOICE_STATUSES.includes(status)) { res.status(400).json({ success: false, error: "Invalid status value" }); return; }

      const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" });
      if (!invoice) { res.status(404).json({ success: false, error: "Invoice not found" }); return; }

      await logActivity({ userId: req.user.id, action: "INVOICE_STATUS_UPDATED", module: "INVOICE", entityId: req.params.id, metadata: { status } });
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to update invoice status" });
    }
  }
);

// GET /api/invoices/:id/pdf
router.get("/:id/pdf", authenticateJWT, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("vendorId")
      .populate("vendor")
      .populate({ path: "poId", populate: [{ path: "rfqId" }, { path: "rfq" }] })
      .populate({ path: "purchaseOrder", populate: [{ path: "rfqId" }, { path: "rfq" }] });

    if (!invoice) { res.status(404).json({ success: false, error: "Invoice not found" }); return; }

    const shaped = shapeInvoice(invoice.toJSON());
    const vendor = shaped.vendor || {};
    const po = shaped.purchaseOrder || {};

    if (req.user.role === "VENDOR") {
      const v = await Vendor.findOne({ email: req.user.email });
      const vendorIdStr = vendor._id?.toString() || vendor.id || "";
      if (!v || vendorIdStr !== v._id.toString()) {
        res.status(403).json({ success: false, error: "Access denied" }); return;
      }
    }

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      vendor,
      purchaseOrder: po,
      subtotal:   Number(invoice.subtotal),
      taxAmount:  Number(invoice.taxAmount),
      grandTotal: Number(invoice.grandTotal),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.end(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to generate PDF" });
  }
});

// POST /api/invoices/:id/email
router.post(
  "/:id/email",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate("vendorId")
        .populate("vendor")
        .populate({ path: "poId", populate: [{ path: "rfqId" }, { path: "rfq" }] })
        .populate({ path: "purchaseOrder", populate: [{ path: "rfqId" }, { path: "rfq" }] });

      if (!invoice) { res.status(404).json({ success: false, error: "Invoice not found" }); return; }

      const shaped = shapeInvoice(invoice.toJSON());
      const vendor = shaped.vendor || {};
      const po = shaped.purchaseOrder || {};
      const recipientEmail = req.body.email ?? vendor.email;

      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        vendor,
        purchaseOrder: po,
        subtotal:   Number(invoice.subtotal),
        taxAmount:  Number(invoice.taxAmount),
        grandTotal: Number(invoice.grandTotal),
      });

      await sendInvoiceEmail({ to: recipientEmail, invoiceNumber: invoice.invoiceNumber, vendorName: vendor.vendorName || vendor.companyName, grandTotal: Number(invoice.grandTotal), pdfBuffer });

      await Invoice.findByIdAndUpdate(req.params.id, { status: "SENT" });
      await logActivity({ userId: req.user.id, action: "INVOICE_STATUS_UPDATED", module: "INVOICE", entityId: req.params.id, metadata: { status: "SENT", emailedTo: recipientEmail } });

      res.json({ success: true, sentTo: recipientEmail });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to send invoice email" });
    }
  }
);

export default router;
