import mongoose from "mongoose";

// Register all Mongoose models
import "./models/User.js";
import "./models/Vendor.js";
import "./models/RFQ.js";
import "./models/Quotation.js";
import "./models/Approval.js";
import "./models/PurchaseOrder.js";
import "./models/Invoice.js";
import "./models/ActivityLog.js";
import "./models/OTP.js";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Environment variable MONGODB_URI is not set. Please add it to backend/.env");
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "vendorbridge",
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
