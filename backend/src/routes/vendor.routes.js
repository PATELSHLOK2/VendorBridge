import { Router } from "express";
import { Vendor } from "../models/Vendor.js";
import { vendorSchema } from "../validations/vendor.validation.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import { sendVendorApprovedEmail } from "../services/email.service.js";

const router = Router();

// GET /api/vendors - List all vendors
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(String(search), "i");
      filter.$or = [
        { vendorName: regex },
        { companyName: regex },
        { contactPerson: regex },
      ];
    }

    const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id - Vendor details
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("createdById", "id firstName lastName email");

    if (!vendor) { res.status(404).json({ success: false, error: "Vendor not found" }); return; }

    const obj = vendor.toJSON();
    obj.createdBy = obj.createdById;
    delete obj.createdById;
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch vendor" });
  }
});

// POST /api/vendors - Create vendor
router.post(
  "/",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const parsed = vendorSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const existing = await Vendor.findOne({ email: parsed.data.email });
      if (existing) { res.status(400).json({ success: false, error: "A vendor with this email already exists." }); return; }

      const vendor = await Vendor.create({ ...parsed.data, createdById: req.user.id });

      await logActivity({ userId: req.user.id, action: "VENDOR_CREATED", module: "VENDOR", entityId: vendor.id, metadata: { vendorName: vendor.vendorName, email: vendor.email } });

      res.status(201).json({ success: true, data: vendor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to create vendor" });
    }
  }
);

// PUT /api/vendors/:id - Update vendor
router.put(
  "/:id",
  authenticateJWT,
  requireRoles(["ADMIN", "PROCUREMENT_OFFICER"]),
  async (req, res) => {
    try {
      const parsed = vendorSchema.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

      const existing = await Vendor.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, error: "Vendor not found" }); return; }

      const vendor = await Vendor.findByIdAndUpdate(req.params.id, parsed.data, { returnDocument: "after" });

      if (existing.status === "INACTIVE" && vendor.status === "ACTIVE") {
        try { await sendVendorApprovedEmail(vendor.email, vendor.companyName); } catch {}
      }

      await logActivity({ userId: req.user.id, action: "VENDOR_UPDATED", module: "VENDOR", entityId: vendor.id, metadata: { vendorName: vendor.vendorName } });

      res.json({ success: true, data: vendor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to update vendor" });
    }
  }
);

// DELETE /api/vendors/:id - Delete vendor
router.delete(
  "/:id",
  authenticateJWT,
  requireRoles(["ADMIN"]),
  async (req, res) => {
    try {
      const existing = await Vendor.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, error: "Vendor not found" }); return; }

      await Vendor.findByIdAndDelete(req.params.id);

      await logActivity({ userId: req.user.id, action: "VENDOR_DELETED", module: "VENDOR", entityId: req.params.id, metadata: { vendorName: existing.vendorName } });

      res.json({ success: true, message: "Vendor deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to delete vendor" });
    }
  }
);

export default router;
