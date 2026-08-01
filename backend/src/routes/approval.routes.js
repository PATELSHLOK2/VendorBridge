import { Router } from "express";
import { Approval } from "../models/Approval.js";
import { Vendor } from "../models/Vendor.js";
import { Invoice } from "../models/Invoice.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import { generatePurchaseOrder } from "../services/purchase-order.service.js";
import { generateInvoice } from "../services/invoice.service.js";
import { generateInvoicePDF } from "../services/pdf.service.js";
import { sendInvoiceEmail } from "../services/email.service.js";

const router = Router();

function shapeApproval(obj) {
  obj.quotation = obj.quotationId;
  obj.rfq = obj.rfqId;
  obj.reviewedBy = obj.reviewedById;
  delete obj.quotationId;
  delete obj.rfqId;
  delete obj.reviewedById;
  return obj;
}

// GET /api/approvals - List approvals
router.get("/", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.json({ success: true, data: [] }); return; }

      const approvals = await Approval.find()
        .populate({ path: "quotationId", populate: { path: "vendorId" }, match: { vendorId: vendor._id } })
        .populate("rfqId")
        .sort({ createdAt: -1 });

      const filtered = approvals
        .filter((a) => a.quotationId)
        .map((a) => shapeApproval(a.toJSON()));

      res.json({ success: true, data: filtered });
      return;
    }

    const approvals = await Approval.find()
      .populate({ path: "quotationId", populate: { path: "vendorId" } })
      .populate("rfqId")
      .populate("reviewedById", "id firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: approvals.map((a) => shapeApproval(a.toJSON())) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch approvals" });
  }
});

// GET /api/approvals/:id - Approval details
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(403).json({ success: false, error: "Access denied" }); return; }

      const approval = await Approval.findById(req.params.id)
        .populate({ path: "quotationId", populate: [{ path: "vendorId" }, { path: "items" }] })
        .populate({ path: "rfqId", populate: { path: "items" } });

      if (!approval || approval.quotationId?.vendorId?._id?.toString() !== vendor._id.toString()) {
        res.status(404).json({ success: false, error: "Approval request not found" }); return;
      }

      res.json({ success: true, data: shapeApproval(approval.toJSON()) });
      return;
    }

    const approval = await Approval.findById(req.params.id)
      .populate({ path: "quotationId", populate: [{ path: "vendorId" }, { path: "items" }] })
      .populate({ path: "rfqId", populate: { path: "items" } })
      .populate("reviewedById", "id firstName lastName email");

    if (!approval) { res.status(404).json({ success: false, error: "Approval request not found" }); return; }

    res.json({ success: true, data: shapeApproval(approval.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch approval" });
  }
});

// POST /api/approvals/:id/approve
router.post(
  "/:id/approve",
  authenticateJWT,
  requireRoles(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const existing = await Approval.findById(id);
      if (!existing) { res.status(404).json({ success: false, error: "Approval request not found." }); return; }
      if (existing.status !== "PENDING") {
        res.status(400).json({ success: false, error: `Cannot approve: request is already ${existing.status.toLowerCase()}.` }); return;
      }

      const approval = await Approval.findByIdAndUpdate(
        id,
        { status: "APPROVED", remarks: remarks ?? null, reviewedById: req.user.id, reviewedAt: new Date() },
        { returnDocument: "after" }
      );

      await logActivity({ userId: req.user.id, action: "APPROVAL_GRANTED", module: "APPROVAL", entityId: id, metadata: { remarks, rfqId: approval.rfqId.toString() } });

      const poResult = await generatePurchaseOrder(id, req.user.id);
      if (!poResult.success) { res.status(400).json({ success: false, error: poResult.error }); return; }

      const poId = poResult.data.id;
      const invoiceResult = await generateInvoice(poId, req.user.id);
      if (!invoiceResult.success) {
        res.json({ success: true, message: "Approved and Purchase Order generated. Invoice generation failed.", poId });
        return;
      }

      const invoiceId = invoiceResult.data.id;
      const invoiceForEmail = await Invoice.findById(invoiceId)
        .populate("vendorId")
        .populate({ path: "poId", populate: { path: "rfqId" } });

      let emailedTo = null;
      let invoiceNumber = null;
      let poNumber = null;

      if (invoiceForEmail) {
        const vendor = invoiceForEmail.vendorId;
        const po = invoiceForEmail.poId;
        invoiceNumber = invoiceForEmail.invoiceNumber;
        poNumber = po?.poNumber;
        emailedTo = vendor?.email;

        try {
          const pdfBuffer = await generateInvoicePDF({
            invoiceNumber: invoiceForEmail.invoiceNumber,
            issuedAt: invoiceForEmail.issuedAt,
            vendor,
            purchaseOrder: po,
            subtotal:   Number(invoiceForEmail.subtotal),
            taxAmount:  Number(invoiceForEmail.taxAmount),
            grandTotal: Number(invoiceForEmail.grandTotal),
          });

          await sendInvoiceEmail({ to: emailedTo, invoiceNumber: invoiceForEmail.invoiceNumber, vendorName: vendor?.vendorName, grandTotal: Number(invoiceForEmail.grandTotal), pdfBuffer });

          await Invoice.findByIdAndUpdate(invoiceId, { status: "SENT" });
          await logActivity({ userId: req.user.id, action: "INVOICE_STATUS_UPDATED", module: "INVOICE", entityId: invoiceId, metadata: { status: "SENT", emailedTo } });
        } catch (emailErr) {
          console.error("[APPROVAL] Invoice email failed:", emailErr.message);
          emailedTo = null;
        }
      }

      res.json({ success: true, message: "Request approved, Purchase Order and Invoice generated.", poId, invoiceId, invoiceNumber, poNumber, emailedTo });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to approve request" });
    }
  }
);

// POST /api/approvals/:id/reject
router.post(
  "/:id/reject",
  authenticateJWT,
  requireRoles(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const existing = await Approval.findById(id);
      if (!existing) { res.status(404).json({ success: false, error: "Approval request not found." }); return; }
      if (existing.status !== "PENDING") {
        res.status(400).json({ success: false, error: `Cannot reject: request is already ${existing.status.toLowerCase()}.` }); return;
      }

      await Approval.findByIdAndUpdate(id, { status: "REJECTED", remarks: remarks ?? null, reviewedById: req.user.id, reviewedAt: new Date() });
      await logActivity({ userId: req.user.id, action: "APPROVAL_REJECTED", module: "APPROVAL", entityId: id, metadata: { remarks } });

      res.json({ success: true, message: "Request rejected successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to reject request" });
    }
  }
);

export default router;
