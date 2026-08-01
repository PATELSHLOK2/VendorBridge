import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { createUserSchema, updateUserSchema } from "../validations/user.validation.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.middleware.js";
import { logActivity } from "../services/activity.service.js";

const router = Router();

// Guard all routes to ADMIN only
router.use(authenticateJWT);
router.use(requireRoles(["ADMIN"]));

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const regex = new RegExp(String(search), "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select("id firstName lastName email phone country role additionalInfo createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch users" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("id firstName lastName email phone country role additionalInfo createdAt");

    if (!user) { res.status(404).json({ success: false, error: "User not found" }); return; }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch user" });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

    const { firstName, lastName, email, password, phone, country, role, additionalInfo } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) { res.status(400).json({ success: false, error: "A user with this email already exists." }); return; }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ firstName, lastName, email, password: hashedPassword, phone, country, role, additionalInfo });

    await logActivity({ userId: req.user.id, action: "USER_CREATED", module: "USER", entityId: user.id, metadata: { createdUserEmail: user.email, role: user.role } });

    res.status(201).json({ success: true, data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to create user" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0].message }); return; }

    const existing = await User.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, error: "User not found" }); return; }

    const updateData = { ...parsed.data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    } else {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { returnDocument: "after" });

    await logActivity({ userId: req.user.id, action: "USER_UPDATED", module: "USER", entityId: user.id, metadata: { updatedUserEmail: user.email, role: user.role } });

    res.json({ success: true, data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to update user" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      res.status(400).json({ success: false, error: "You cannot delete your own account." }); return;
    }

    const existing = await User.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, error: "User not found" }); return; }

    await User.findByIdAndDelete(req.params.id);
    await logActivity({ userId: req.user.id, action: "USER_DELETED", module: "USER", entityId: req.params.id, metadata: { deletedUserEmail: existing.email } });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to delete user" });
  }
});

export default router;
