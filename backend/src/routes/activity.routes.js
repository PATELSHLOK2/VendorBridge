import { Router } from "express";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { getActivityLogs } from "../services/activity.service.js";

const router = Router();

const VALID_MODULES = ["USER", "VENDOR", "RFQ", "QUOTATION", "APPROVAL", "PURCHASE_ORDER", "INVOICE"];

// GET /api/activity-logs (ADMIN only)
router.get(
  "/",
  authenticateJWT,
  requireRoles(["ADMIN"]),
  async (req, res) => {
    try {
      const moduleFilter = req.query.module ? String(req.query.module) : undefined;
      const page     = req.query.page     ? parseInt(String(req.query.page))     : 1;
      const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;

      if (moduleFilter && !VALID_MODULES.includes(moduleFilter)) {
        res.status(400).json({ success: false, error: "Invalid module filter value" });
        return;
      }

      const result = await getActivityLogs(moduleFilter, page, pageSize);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch activity logs" });
    }
  }
);

export default router;
