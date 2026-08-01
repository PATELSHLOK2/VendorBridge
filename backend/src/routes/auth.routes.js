import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";
import { OTP } from "../models/OTP.js";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";
import {
  sendOTPEmail,
  sendVendorRegisteredEmail,
  sendAdminNewVendorRegisteredEmail,
} from "../services/email.service.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email address is required." });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt },
      { upsert: true, returnDocument: "after" }
    );

    await sendOTPEmail(email, otpCode);

    res.json({ success: true, message: "Verification OTP code sent to your email.", otpCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to send OTP email." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { firstName, lastName, email, password, phone, country, companyName, address, additionalInfo } = parsed.data;
    const { otpCode } = req.body;

    if (!otpCode) {
      res.status(400).json({ success: false, error: "OTP verification code is required." });
      return;
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.code !== otpCode || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: "Invalid or expired OTP verification code." });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      res.status(400).json({ success: false, error: "A vendor profile with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      country,
      role: "VENDOR",
      additionalInfo,
    });

    const vendor = await Vendor.create({
      vendorName: companyName,
      companyName,
      contactPerson: `${firstName} ${lastName}`,
      email,
      phone,
      address,
      status: "INACTIVE",
      createdById: user._id,
    });

    await OTP.deleteOne({ email });

    await logActivity({
      userId: user.id,
      action: "USER_REGISTERED",
      module: "USER",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    await logActivity({
      userId: user.id,
      action: "VENDOR_CREATED",
      module: "VENDOR",
      entityId: vendor.id,
      metadata: { companyName: vendor.companyName },
    });

    try { await sendVendorRegisteredEmail(email, companyName); } catch {}
    try {
      const admins = await User.find({ role: "ADMIN" });
      for (const admin of admins) {
        await sendAdminNewVendorRegisteredEmail(admin.email, companyName, `${firstName} ${lastName}`, email);
      }
    } catch {}

    res.status(201).json({ success: true, message: "Vendor registered successfully. Pending approval." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    let { email, password } = parsed.data;

    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail === "admin")   email = "admin@vendorbridge.com";
    else if (lowerEmail === "officer") email = "officer@vendorbridge.com";
    else if (lowerEmail === "manager") email = "manager@vendorbridge.com";
    else if (lowerEmail === "vendor")  email = "vendor@techsupplies.com";

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    let isApproved = true;
    if (user.role === "VENDOR") {
      const vendor = await Vendor.findOne({ email: user.email });
      isApproved = vendor?.status === "ACTIVE";
    }

    if (!isApproved) {
      res.status(403).json({ success: false, error: "Your vendor account is pending approval from an Administrator." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    await logActivity({
      userId: user.id,
      action: "USER_LOGGED_IN",
      module: "USER",
      entityId: user.id,
      metadata: { email: user.email },
    });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, isApproved },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateJWT, async (req, res) => {
  const user = req.user;
  let isApproved = true;
  if (user.role === "VENDOR") {
    const vendor = await Vendor.findOne({ email: user.email });
    isApproved = vendor?.status === "ACTIVE";
  }
  res.json({ success: true, data: { user: { ...user, isApproved } } });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email address is required." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.json({ success: true, message: "If this email is registered, a password reset code has been sent." });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate({ email }, { code: otp, expiresAt }, { upsert: true });
    await sendOTPEmail(email, otp);

    res.json({ success: true, message: "If this email is registered, a password reset code has been sent." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to process forgot-password request" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      res.status(400).json({ success: false, error: "Email, OTP code, and new password are required." });
      return;
    }

    if (!newPassword || newPassword.length < 1) {
      res.status(400).json({ success: false, error: "New password is required." });
      return;
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.code !== otpCode || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: "Invalid or expired verification code." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await OTP.deleteOne({ email });

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to reset password." });
  }
});

export default router;
