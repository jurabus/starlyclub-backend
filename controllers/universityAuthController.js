import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Allowed domains
const ALLOWED_DOMAINS = ["@harvard.edu", "@cairo.edu", "@oxford.ac.uk"]; // adjust as needed

// 1️⃣ Request email verification
export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  // Check allowed domain
  if (!ALLOWED_DOMAINS.some((d) => email.endsWith(d)))
    return res.status(400).json({ message: "Email domain not authorized" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const verificationLink = `${process.env.FRONTEND_URL}/create-profile?token=${token}`;

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: `"StarlyClub" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Verify your university email",
    html: `<p>Click the link below to verify your university email:</p>
           <a href="${verificationLink}">${verificationLink}</a>`,
  });

  res.json({ success: true, message: "Verification link sent" });
};

// 2️⃣ Verify token and pre-create account
export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const existing = await Customer.findOne({ email: decoded.email });

    if (existing && existing.isVerified)
      return res.status(400).json({ message: "Already verified" });

    if (!existing)
      await Customer.create({ email: decoded.email, isVerified: true });

    res.redirect(`${process.env.FRONTEND_URL}/create-profile?verified=${decoded.email}`);
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { email, password, name, age, phone, university } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const user = await Customer.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.name = name;
    user.age = age;
    user.phone = phone;
    user.university = university;
    user.isVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: "Profile created successfully", user });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
