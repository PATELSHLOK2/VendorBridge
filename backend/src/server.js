import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables BEFORE connecting to DB
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import rfqRoutes from "./routes/rfq.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import purchaseOrderRoutes from "./routes/purchase-order.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import reportRoutes from "./routes/report.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// Enable CORS & Body Parsers
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Serve static React 19 frontend files from /frontend/dist
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Fallback to React index.html for SPA routing
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ success: false, error: "API endpoint not found" });
  } else if (path.extname(req.path)) {
    res.status(404).send("File not found");
  } else if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    res.sendFile(path.join(frontendDist, "index.html"));
  } else {
    res.send("VendorBridge API Server Running");
  }
});

// Helper function to start listening on available port
function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`🚀 VendorBridge API & Web Server running on port ${portToUse}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${portToUse} is in use. Trying port ${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error("Server error:", err);
    }
  });
}

// Connect to MongoDB, then start server
connectDB().then(() => {
  startServer(PORT);
});
