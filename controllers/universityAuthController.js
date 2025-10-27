import Customer from "../models/Customer.js";
import Cart from "../models/Cart.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { mergeCarts as mergeCartUtility } from "./cartController.js"; // adjust import if needed
// Allowed domains
const ALLOWED_DOMAINS = ["@harvard.edu", "@cairo.edu", "@oxford.ac.uk"]; // adjust as needed

// 1️⃣ Request email verification
export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!ALLOWED_DOMAINS.some((d) => email.endsWith(d)))
    return res.status(400).json({ message: "Email domain not authorized" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const verificationLink = `${process.env.FRONTEND_URL}/create-profile?token=${token}`;

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

    if (!existing) {
      // ✅ Create verified account immediately
      const newCustomer = await Customer.create({
        email: decoded.email,
        isVerified: true,
      });

      // ✅ Create a fresh empty cart and link it
      const cart = await Cart.create({ userId: newCustomer._id, items: [] });
      newCustomer.cartId = cart._id;
      await newCustomer.save();
    }

    res.redirect(`${process.env.FRONTEND_URL}/create-profile?verified=${decoded.email}`);
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// 3️⃣ Complete profile setup after verification
export const completeProfile = async (req, res) => {
  try {
    const { email, password, name, age, phone, university, referralCode } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const user = await Customer.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 🔐 Hash password & fill profile
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.name = name;
    user.age = age;
    user.phone = phone;
    user.university = university;
    user.isVerified = true;

    // 🪄 Auto-generate referral code if missing
    if (!user.referralCode) {
      user.referralCode = "STARLY" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 💰 Initialize wallet fields if missing
    if (typeof user.walletBalance === "undefined") user.walletBalance = 0;
    if (typeof user.referralEarnings === "undefined") user.referralEarnings = 0;

    // 🧩 Link referrer if referral code provided
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await Customer.findOne({ referralCode: referralCode.trim() });
      if (referrer && !user.referredBy) {
        user.referredBy = referrer._id;
      }
    }

    // 🛒 Ensure persistent cart exists for this customer
    if (!user.cartId) {
      const cart = await Cart.create({ userId: user._id, items: [] });
      user.cartId = cart._id;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile created successfully",
      user: {
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        cartId: user.cartId,
      },
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// 4️⃣ Login (includes auto cart merge)


export const login = async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;

    const user = await Customer.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    // 🪪 Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🛒 Ensure user has a persistent cart
    let userCart = await Cart.findOne({ userId: user._id });
    if (!userCart) {
      userCart = await Cart.create({ userId: user._id, items: [] });
    }

    // 🔄 Merge guest cart if sessionId provided
    let mergedCart = userCart;
    if (sessionId) {
      const guestCart = await Cart.findOne({ sessionId });
      if (guestCart && guestCart.items.length > 0) {
        guestCart.items.forEach((gItem) => {
          const existing = mergedCart.items.find(
            (i) => i.productId.toString() === gItem.productId.toString()
          );
          if (existing) existing.quantity += gItem.quantity;
          else mergedCart.items.push(gItem);
        });
        await mergedCart.save();
        await Cart.deleteOne({ sessionId });
      }
    }

    // Populate the merged cart before returning
    const fullCart = await Cart.findById(mergedCart._id).populate("items.productId");
    const cartResponse = {
      _id: fullCart._id,
      userId: fullCart.userId,
      items: fullCart.items.map((i) => ({
        _id: i.productId?._id,
        name: i.productId?.name,
        imageUrl: i.productId?.imageUrl,
        newPrice: i.productId?.newPrice,
        oldPrice: i.productId?.oldPrice,
        quantity: i.quantity,
      })),
      total: fullCart.items.reduce(
        (sum, i) => sum + (i.productId?.newPrice || 0) * i.quantity,
        0
      ),
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      cart: cartResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
