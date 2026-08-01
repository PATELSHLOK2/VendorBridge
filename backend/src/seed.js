/**
 * VendorBridge MongoDB Seed Script
 * Run with: node src/seed.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import { User } from "./models/User.js";
import { Vendor } from "./models/Vendor.js";

async function seed() {
  await connectDB();

  console.log("🌱 Seeding demo data...");

  const demoUsers = [
    { firstName: "Admin",    lastName: "User",   email: "admin@vendorbridge.com",  role: "ADMIN",              password: "123" },
    { firstName: "Priya",    lastName: "Sharma", email: "officer@vendorbridge.com", role: "PROCUREMENT_OFFICER", password: "123" },
    { firstName: "Rohan",    lastName: "Mehta",  email: "manager@vendorbridge.com", role: "MANAGER",            password: "123" },
    { firstName: "Tech",     lastName: "Vendor", email: "vendor@techsupplies.com",  role: "VENDOR",             password: "123" },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  ⚡ User ${u.email} already exists — skipping`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await User.create({ ...u, password: hashed });
    console.log(`  ✅ Created user: ${u.email} (${u.role})`);

    // Create vendor profile for the VENDOR demo account
    if (u.role === "VENDOR") {
      const vendorExists = await Vendor.findOne({ email: u.email });
      if (!vendorExists) {
        await Vendor.create({
          vendorName:    "Tech Supplies Pvt Ltd",
          companyName:   "Tech Supplies Pvt Ltd",
          contactPerson: `${u.firstName} ${u.lastName}`,
          email:         u.email,
          phone:         "+91-9999999999",
          country:       "India",
          status:        "ACTIVE", // Pre-approved for demo
          createdById:   user._id,
        });
        console.log(`  ✅ Created vendor: Tech Supplies Pvt Ltd`);
      }
    }
  }

  console.log("\n🎉 Seed complete! Demo credentials:\n");
  console.log("  admin   / 123  →  admin@vendorbridge.com");
  console.log("  officer / 123  →  officer@vendorbridge.com");
  console.log("  manager / 123  →  manager@vendorbridge.com");
  console.log("  vendor  / 123  →  vendor@techsupplies.com\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
