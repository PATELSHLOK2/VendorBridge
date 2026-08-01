import { Router } from "express";
import mongoose from "mongoose";
import { Quotation } from "../models/Quotation.js";
import { Vendor } from "../models/Vendor.js";
import { RFQ } from "../models/RFQ.js";
import { Approval } from "../models/Approval.js";
import { quotationSchema } from "../validations/quotation.validation.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";

const router = Router();

function calculateItemTotal(unitPrice, quantity, taxPct) {
  const subtotal = unitPrice * quantity;
  return subtotal + (subtotal * taxPct) / 100;
}

// GET /api/quotations - List quotations
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const { rfqId } = req.query;

    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.json({ success: true, data: [] }); return; }

      const filter = { vendorId: vendor._id };
      if (rfqId) filter.rfqId = rfqId;

      const quotations = await Quotation.find(filter)
        .populate("rfqId")
        .sort({ updatedAt: -1 });

      const shaped = quotations.map((q) => {
        const obj = q.toJSON();
        obj.rfq = obj.rfqId;
        delete obj.rfqId;
        return obj;
      });
      res.json({ success: true, data: shaped });
      return;
    }

    const filter = {};
    if (rfqId) filter.rfqId = rfqId;

    const quotations = await Quotation.find(filter)
      .populate("rfqId")
      .populate("vendorId")
      .sort({ updatedAt: -1 });

    const shaped = quotations.map((q) => {
      const obj = q.toJSON();
      obj.rfq = obj.rfqId;
      obj.vendor = obj.vendorId;
      delete obj.rfqId;
      delete obj.vendorId;
      return obj;
    });
    res.json({ success: true, data: shaped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch quotations" });
  }
});

// GET /api/quotations/:id - Quotation details
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(403).json({ success: false, error: "Access denied" }); return; }

      const q = await Quotation.findOne({ _id: id, vendorId: vendor._id })
        .populate({ path: "rfqId", populate: { path: "items" } });

      if (!q) { res.status(404).json({ success: false, error: "Quotation not found" }); return; }

      const obj = q.toJSON();
      obj.rfq = obj.rfqId;
      delete obj.rfqId;
      res.json({ success: true, data: obj });
      return;
    }

    const q = await Quotation.findById(id)
      .populate({ path: "rfqId", populate: { path: "items" } })
      .populate("vendorId");

    if (!q) { res.status(404).json({ success: false, error: "Quotation not found" }); return; }

    const obj = q.toJSON();
    obj.rfq = obj.rfqId;
    obj.vendor = obj.vendorId;
    delete obj.rfqId;
    delete obj.vendorId;
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch quotation" });
  }
});

// POST /api/quotations/draft - Save Draft
router.post(
  "/draft",
  authenticateJWT,
  requireRoles(["VENDOR"]),
  async (req, res) => {
    try {
      const parsed = quotationSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(400).json({ success: false, error: "Vendor record not found for this user." }); return; }

      const rfq = await RFQ.findById(parsed.data.rfqId);
      if (!rfq || rfq.status !== "PUBLISHED") {
        res.status(400).json({ success: false, error: "Quotations can only be submitted for published RFQs." }); return;
      }
      if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
        res.status(400).json({ success: false, error: "The submission deadline for this RFQ has passed." }); return;
      }

      const totalAmount = parsed.data.items.reduce(
        (sum, item) => sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage), 0
      );

      const quotation = await Quotation.findOneAndUpdate(
        { rfqId: parsed.data.rfqId, vendorId: vendor._id },
        {
          deliveryTimeline: parsed.data.deliveryTimeline,
          notes: parsed.data.notes,
          totalAmount,
          status: "DRAFT",
          items: parsed.data.items.map((item) => ({
            rfqItemId:     new mongoose.Types.ObjectId(item.rfqItemId),
            unitPrice:     item.unitPrice,
            quantity:      item.quantity,
            taxPercentage: item.taxPercentage,
            totalAmount:   calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
          })),
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, data: { id: quotation.id } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to save draft" });
    }
  }
);

// POST /api/quotations/submit - Submit Quotation
router.post(
  "/submit",
  authenticateJWT,
  requireRoles(["VENDOR"]),
  async (req, res) => {
    try {
      const parsed = quotationSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(400).json({ success: false, error: "Vendor record not found for this user." }); return; }

      const rfq = await RFQ.findById(parsed.data.rfqId);
      if (!rfq || rfq.status !== "PUBLISHED") {
        res.status(400).json({ success: false, error: "Quotations can only be submitted for published RFQs." }); return;
      }
      if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
        res.status(400).json({ success: false, error: "The submission deadline for this RFQ has passed." }); return;
      }

      const totalAmount = parsed.data.items.reduce(
        (sum, item) => sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage), 0
      );

      const quotation = await Quotation.findOneAndUpdate(
        { rfqId: parsed.data.rfqId, vendorId: vendor._id },
        {
          deliveryTimeline: parsed.data.deliveryTimeline,
          notes: parsed.data.notes,
          totalAmount,
          status: "SUBMITTED",
          submittedAt: new Date(),
          items: parsed.data.items.map((item) => ({
            rfqItemId:     new mongoose.Types.ObjectId(item.rfqItemId),
            unitPrice:     item.unitPrice,
            quantity:      item.quantity,
            taxPercentage: item.taxPercentage,
            totalAmount:   calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
          })),
        },
        { upsert: true, new: true }
      );

      await logActivity({ userId: req.user.id, action: "QUOTATION_SUBMITTED", module: "QUOTATION", entityId: quotation.id, metadata: { rfqId: parsed.data.rfqId, totalAmount } });

      res.json({ success: true, data: { id: quotation.id } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to submit quotation" });
    }
  }
);

// POST /api/quotations/:id/select - Select Quotation & trigger approval
router.post(
  "/:id/select",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const quotation = await Quotation.findById(id);
      if (!quotation) { res.status(404).json({ success: false, error: "Quotation not found." }); return; }

      // Reject all others for this RFQ
      await Quotation.updateMany(
        { rfqId: quotation.rfqId, _id: { $ne: id } },
        { status: "REJECTED" }
      );

      await Quotation.findByIdAndUpdate(id, { status: "SELECTED" });

      await logActivity({ userId: req.user.id, action: "QUOTATION_SELECTED", module: "QUOTATION", entityId: id, metadata: { rfqId: quotation.rfqId.toString() } });

      const existingApproval = await Approval.findOne({ quotationId: id });
      if (!existingApproval) {
        await Approval.create({ quotationId: id, rfqId: quotation.rfqId, status: "PENDING" });
        await logActivity({ userId: req.user.id, action: "APPROVAL_REQUESTED", module: "APPROVAL", entityId: id, metadata: { rfqId: quotation.rfqId.toString(), quotationId: id } });
      }

      res.json({ success: true, message: "Quotation selected and submitted for approval successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to select quotation" });
    }
  }
);

// POST /api/quotations/:id/reject - Reject Quotation
router.post(
  "/:id/reject",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      await Quotation.findByIdAndUpdate(req.params.id, { status: "REJECTED" });
      await logActivity({ userId: req.user.id, action: "QUOTATION_REJECTED", module: "QUOTATION", entityId: req.params.id, metadata: {} });
      res.json({ success: true, message: "Quotation rejected successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to reject quotation" });
    }
  }
);

export default router;
