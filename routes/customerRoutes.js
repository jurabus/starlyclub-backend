import express from "express";
import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const user = await Customer.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/update-profile", async (req, res) => {
  try {
    const { userId, name, phone } = req.body;
    const user = await Customer.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    await user.save();

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await Customer.findById(userId);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
// Forgot password - send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Customer.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Starly Club" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click the link below to reset your password (valid for 15 minutes):</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ success: true, message: "Reset link sent successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Reset password - verify token and update
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Customer.findById(decoded.id);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(400).json({ success: false, message: "Reset link expired" });
    }
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
