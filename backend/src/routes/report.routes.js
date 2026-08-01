import { Router } from "express";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import {
  getDashboardKPIs,
  getReportKPIs,
  getSpendByCategory,
  getTopVendors,
  getMonthlySpendTrend,
} from "../services/report.service.js";

const router = Router();

// GET /api/reports/dashboard
router.get("/dashboard", authenticateJWT, async (req, res) => {
  try {
    const kpis = await getDashboardKPIs();
    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch dashboard KPIs" });
  }
});

// GET /api/reports/kpis
router.get("/kpis", authenticateJWT, requireRoles(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const kpis = await getReportKPIs();
    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch report KPIs" });
  }
});

// GET /api/reports/spend-by-category
router.get("/spend-by-category", authenticateJWT, requireRoles(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const data = await getSpendByCategory();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch category spend" });
  }
});

// GET /api/reports/top-vendors
router.get("/top-vendors", authenticateJWT, requireRoles(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const data = await getTopVendors(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch top vendors" });
  }
});

// GET /api/reports/spend-trend
router.get("/spend-trend", authenticateJWT, requireRoles(["ADMIN", "MANAGER"]), async (req, res) => {
  try {
    const year = req.query.year ? parseInt(String(req.query.year)) : undefined;
    const data = await getMonthlySpendTrend(year);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch spend trend" });
  }
});

// GET /api/reports/export
router.get(
  "/export",
  authenticateJWT,
  requireRoles(["ADMIN", "MANAGER"]),
  async (req, res) => {
    try {
      const format = req.query.format ?? "json";
      const year = req.query.year ? parseInt(String(req.query.year)) : undefined;

      const [kpis, spendByCategory, topVendors, monthlyTrend] = await Promise.all([
        getReportKPIs(),
        getSpendByCategory(),
        getTopVendors(10),
        getMonthlySpendTrend(year),
      ]);

      const reportData = { kpis, spendByCategory, topVendors, monthlyTrend };

      if (format === "json") { res.json({ success: true, data: reportData }); return; }

      const csv = [
        "Category,Total Spend",
        ...spendByCategory.map((r) => `"${r.category}",${r.total}`),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="vendorbridge-report-${new Date().toISOString().split("T")[0]}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message || "Failed to export reports" });
    }
  }
);

export default router;
