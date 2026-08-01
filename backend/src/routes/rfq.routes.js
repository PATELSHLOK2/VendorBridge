import { Router } from "express";
import mongoose from "mongoose";
import { RFQ } from "../models/RFQ.js";
import { Vendor } from "../models/Vendor.js";
import { rfqSchema } from "../validations/rfq.validation.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import { generateDocumentNumber } from "../utils.js";

const router = Router();

// GET /api/rfqs - List RFQs
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const { status } = req.query;

    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.json({ success: true, data: [] }); return; }

      const filter = {
        "vendors.vendorId": vendor._id,
        status: status ? String(status) : { $in: ["PUBLISHED", "CLOSED"] },
      };

      const rfqs = await RFQ.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: rfqs });
      return;
    }

    const filter = {};
    if (status) filter.status = status;

    const rfqs = await RFQ.find(filter)
      .populate("vendors.vendorId")
      .sort({ createdAt: -1 });

    const shaped = rfqs.map((r) => {
      const obj = r.toJSON();
      obj.vendors = (obj.vendors || []).map((v) => ({
        vendorId: v.vendorId?._id?.toString() ?? v.vendorId,
        vendor: v.vendorId,
      }));
      return obj;
    });

    res.json({ success: true, data: shaped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch RFQs" });
  }
});

// GET /api/rfqs/:id - RFQ details
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) { res.status(403).json({ success: false, error: "Access denied" }); return; }

      const rfq = await RFQ.findOne({
        _id: id,
        "vendors.vendorId": vendor._id,
        status: { $in: ["PUBLISHED", "CLOSED"] },
      });

      if (!rfq) { res.status(404).json({ success: false, error: "RFQ not found or not assigned to you" }); return; }
      res.json({ success: true, data: rfq });
      return;
    }

    const rfq = await RFQ.findById(id).populate("vendors.vendorId");
    if (!rfq) { res.status(404).json({ success: false, error: "RFQ not found" }); return; }

    const obj = rfq.toJSON();
    obj.vendors = (obj.vendors || []).map((v) => ({
      vendorId: v.vendorId?._id?.toString() ?? v.vendorId,
      vendor: v.vendorId,
    }));

    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch RFQ" });
  }
});

// POST /api/rfqs - Create RFQ
router.post(
  "/",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const parsed = rfqSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const rfqCount = await RFQ.countDocuments();
      const rfqNumber = generateDocumentNumber("RFQ", rfqCount);

      const rfq = await RFQ.create({
        rfqNumber,
        title:       parsed.data.title,
        description: parsed.data.description,
        category:    parsed.data.category,
        deadline:    parsed.data.deadline,
        status:      "DRAFT",
        createdById: req.user.id,
        items: parsed.data.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit:     item.unit,
        })),
        vendors: parsed.data.vendorIds.map((vendorId) => ({ vendorId: new mongoose.Types.ObjectId(vendorId) })),
      });

      await logActivity({ userId: req.user.id, action: "RFQ_CREATED", module: "RFQ", entityId: rfq.id, metadata: { rfqNumber: rfq.rfqNumber, title: rfq.title } });

      res.status(201).json({ success: true, data: rfq });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to create RFQ" });
    }
  }
);

// POST /api/rfqs/:id/publish
router.post(
  "/:id/publish",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const rfq = await RFQ.findByIdAndUpdate(req.params.id, { status: "PUBLISHED" }, { returnDocument: "after" });
      if (!rfq) { res.status(404).json({ success: false, error: "RFQ not found" }); return; }
      await logActivity({ userId: req.user.id, action: "RFQ_PUBLISHED", module: "RFQ", entityId: rfq.id, metadata: { rfqNumber: rfq.rfqNumber } });
      res.json({ success: true, data: rfq });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to publish RFQ" });
    }
  }
);

// POST /api/rfqs/:id/close
router.post(
  "/:id/close",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const rfq = await RFQ.findByIdAndUpdate(req.params.id, { status: "CLOSED" }, { returnDocument: "after" });
      if (!rfq) { res.status(404).json({ success: false, error: "RFQ not found" }); return; }
      await logActivity({ userId: req.user.id, action: "RFQ_CLOSED", module: "RFQ", entityId: rfq.id, metadata: { rfqNumber: rfq.rfqNumber } });
      res.json({ success: true, data: rfq });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to close RFQ" });
    }
  }
);

// PUT /api/rfqs/:id - Update Draft RFQ
router.put(
  "/:id",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const parsed = rfqSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const existing = await RFQ.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, error: "RFQ not found" }); return; }
      if (existing.status !== "DRAFT") { res.status(400).json({ success: false, error: "Only draft RFQs can be edited" }); return; }

      const updated = await RFQ.findByIdAndUpdate(
        req.params.id,
        {
          title:       parsed.data.title,
          description: parsed.data.description,
          category:    parsed.data.category,
          deadline:    parsed.data.deadline,
          items: parsed.data.items.map((item) => ({ itemName: item.itemName, quantity: item.quantity, unit: item.unit })),
          vendors: parsed.data.vendorIds.map((vendorId) => ({ vendorId: new mongoose.Types.ObjectId(vendorId) })),
        },
        { returnDocument: "after" }
      );

      await logActivity({ userId: req.user.id, action: "RFQ_UPDATED", module: "RFQ", entityId: req.params.id, metadata: { rfqNumber: existing.rfqNumber } });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to update RFQ" });
    }
  }
);

export default router;
