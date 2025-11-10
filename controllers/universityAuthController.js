// controllers/universityAuthController.js
import Customer from "../models/Customer.js";
import Cart from "../models/Cart.js";
import AuthorizedDomain from "../models/AuthorizedDomain.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { mergeCarts as mergeCartUtility } from "../controllers/cartController.js";

/* ============================================================
   🧠 Helper: Fetch authorized domains dynamically from DB
   ============================================================ */
async function getAllowedDomains() {
  try {
    const domains = await AuthorizedDomain.find({});
    if (!domains.length) {
      console.warn("⚠️ No authorized domains found in DB — using fallback list");
      return ["@harvard.edu", "@cairo.edu", "@oxford.ac.uk"];
    }
    return domains.map((d) => d.domain.toLowerCase());
  } catch (err) {
    console.error("getAllowedDomains DB error:", err);
    return ["@harvard.edu", "@cairo.edu", "@oxford.ac.uk"];
  }
}

/* ============================================================
   1️⃣ Request Email Verification (Dynamic Domain Logic)
   ============================================================ */
export const sendVerificationEmail = async (req, res) => {
  try {
    const { email, referralCode } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const allowedDomains = await getAllowedDomains();
    const emailLower = email.toLowerCase();
    const isUniversityEmail = allowedDomains.some((d) =>
      emailLower.endsWith(d)
    );

    // 🧩 CASE 1: University email → skip referral
    if (isUniversityEmail) {
      await sendVerificationMail(email);
      return res.json({
        success: true,
        message: "Verification link sent to university email",
      });
    }

    // 🧩 CASE 2: Personal email → referral required
    if (!referralCode)
      return res.status(400).json({
        success: false,
        message:
          "Referral code required for non-university emails. Please enter a valid referral.",
      });

    // 🔍 Check referral code + ensure referrer belongs to an authorized domain
    const referrer = await Customer.findOne({
      referralCode: referralCode.trim(),
    });
    if (!referrer)
      return res
        .status(404)
        .json({ success: false, message: "Invalid referral code" });

    const referrerEmail = referrer.email?.toLowerCase() || "";
    const referrerIsUniversity = allowedDomains.some((d) =>
      referrerEmail.endsWith(d)
    );

    if (!referrerIsUniversity) {
      return res.status(403).json({
        success: false,
        message:
          "This referral code is not linked to a verified university member",
      });
    }

    // ✅ Referral verified — proceed to send verification email
    await sendVerificationMail(email);
    return res.json({
      success: true,
      message:
        "Verification link sent (referral verified via university member)",
    });
  } catch (err) {
    console.error("❌ sendVerificationEmail error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   📧 Helper: Send actual verification mail
   ============================================================ */
async function sendVerificationMail(email) {
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const verificationLink = `${process.env.FRONTEND_URL}/create-profile?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  await transporter.sendMail({
    from: `"StarlyClub" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Verify your email for Starly Club",
    html: `
      <p>Click below to verify your email address:</p>
      <a href="${verificationLink}" style="color:#0066cc">${verificationLink}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}

/* ============================================================
   2️⃣ Complete Profile Setup
   ============================================================ */
export const completeProfile = async (req, res) => {
  try {
    const { email, password, name, age, phone, university, referralCode } =
      req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let user = await Customer.findOne({ email });

    // Auto-create if not already verified (e.g., referral case)
    if (!user) {
      user = await Customer.create({
        email,
        isVerified: true,
      });
      const cart = await Cart.create({ userId: user._id, items: [] });
      user.cartId = cart._id;
    }

    // 🔐 Hash password & complete profile
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.name = name;
    user.age = age;
    user.phone = phone;
    user.university = university;
    user.isVerified = true;

    // 🪄 Generate referral code if missing
    if (!user.referralCode) {
      user.referralCode =
        "STARLY" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 💰 Wallet & referral defaults
    if (typeof user.walletBalance === "undefined") user.walletBalance = 0;
    if (typeof user.referralEarnings === "undefined")
      user.referralEarnings = 0;

    // 🧩 Link referrer if referral code provided
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await Customer.findOne({
        referralCode: referralCode.trim(),
      });
      if (referrer && !user.referredBy) {
        user.referredBy = referrer._id;
      }
    }

    // 🛒 Ensure cart exists
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
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/* ============================================================
   3️⃣ Verify Token and Pre-create Account
   ============================================================ */
export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const existing = await Customer.findOne({ email: decoded.email });

    if (existing && existing.isVerified)
      return res.status(400).json({ message: "Already verified" });

    if (!existing) {
      const newCustomer = await Customer.create({
        email: decoded.email,
        isVerified: true,
      });
      const cart = await Cart.create({ userId: newCustomer._id, items: [] });
      newCustomer.cartId = cart._id;
      await newCustomer.save();
    }

    res.redirect(
      `${process.env.FRONTEND_URL}/create-profile?verified=${decoded.email}`
    );
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

/* ============================================================
   4️⃣ Login (includes auto cart merge)
   ============================================================ */
export const login = async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;

    const user = await Customer.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🛒 Ensure persistent cart
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

    const fullCart = await Cart.findById(mergedCart._id).populate(
      "items.productId"
    );
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
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
