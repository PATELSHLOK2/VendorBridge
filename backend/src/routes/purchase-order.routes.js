import { Router } from "express";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { Vendor } from "../models/Vendor.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import { generateInvoice } from "../services/invoice.service.js";

const router = Router();

const PO_STATUSES = ["ISSUED", "ACKNOWLEDGED", "FULFILLED", "CANCELLED"];

function shapePO(obj) {
  if (obj.createdById && typeof obj.createdById === "object") {
    obj.createdBy = obj.createdById;
    delete obj.createdById;
  }
  if (obj.vendorId && typeof obj.vendorId === "object") {
    obj.vendor = obj.vendorId;
    delete obj.vendorId;
  }
  if (obj.rfqId && typeof obj.rfqId === "object") {
    obj.rfq = obj.rfqId;
    delete obj.rfqId;
  }
  return obj;
}

// GET /api/purchase-orders
router.get("/", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.json({ success: true, data: [] }); return; }

      const pos = await PurchaseOrder.find({ vendorId: vendor._id })
        .populate("rfqId").populate("vendorId")
        .sort({ issueDate: -1 });

      res.json({ success: true, data: pos.map((p) => shapePO(p.toJSON())) });
      return;
    }

    const pos = await PurchaseOrder.find()
      .populate("rfqId").populate("vendorId")
      .populate("createdById", "id firstName lastName email")
      .sort({ issueDate: -1 });

    res.json({ success: true, data: pos.map((p) => shapePO(p.toJSON())) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch POs" });
  }
});

// GET /api/purchase-orders/:id
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(403).json({ success: false, error: "Access denied" }); return; }

      const po = await PurchaseOrder.findOne({ _id: req.params.id, vendorId: vendor._id })
        .populate("rfqId").populate("vendorId");

      if (!po) { res.status(404).json({ success: false, error: "Purchase order not found" }); return; }
      res.json({ success: true, data: shapePO(po.toJSON()) });
      return;
    }

    const po = await PurchaseOrder.findById(req.params.id)
      .populate("rfqId").populate("vendorId")
      .populate("createdById", "id firstName lastName email");

    if (!po) { res.status(404).json({ success: false, error: "Purchase order not found" }); return; }
    res.json({ success: true, data: shapePO(po.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch PO" });
  }
});

// PUT /api/purchase-orders/:id/status
router.put(
  "/:id/status",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!PO_STATUSES.includes(status)) { res.status(400).json({ success: false, error: "Invalid status value" }); return; }

      const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" });
      if (!po) { res.status(404).json({ success: false, error: "Purchase order not found" }); return; }

      await logActivity({ userId: req.user.id, action: "PO_STATUS_UPDATED", module: "PURCHASE_ORDER", entityId: req.params.id, metadata: { poNumber: po.poNumber, status } });
      res.json({ success: true, data: po });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to update PO status" });
    }
  }
);

// POST /api/purchase-orders/:id/invoice
router.post(
  "/:id/invoice",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const result = await generateInvoice(req.params.id, req.user.id);
      if (!result.success) { res.status(400).json({ success: false, error: result.error }); return; }
      res.status(201).json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to generate invoice" });
    }
  }
);

export default router;
