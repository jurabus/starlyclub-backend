// controllers/providerAuthController.js
import Provider from "../models/Provider.js";
import jwt from "jsonwebtoken";

export const signupProvider = async (req, res) => {
  try {
    const {
      name,
      username,
      accessKey,
      logoUrl,
      description,
      category,
      subcategory,
      area,
      voucherDiscountPercent,
      minimumVoucherAmount,
      maximumDiscount,
      featured,
    } = req.body;

    // ========================================
    // 🔹 Validate required fields
    // ========================================
    if (!name || !username || !accessKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, username, accessKey",
      });
    }

    // ========================================
    // 🔹 Ensure username is unique
    // ========================================
    const exists = await Provider.findOne({ username });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // ========================================
    // 🔹 Create Provider exactly matching schema
    // ========================================
    const provider = await Provider.create({
      name,
      username,
      accessKey,

      // optional fields:
      logoUrl: logoUrl || "",
      description: description || "",
      category: category || "",
      subcategory: subcategory || "",
      area: area || "Cairo",

      voucherDiscountPercent: voucherDiscountPercent ?? 0,
      minimumVoucherAmount: minimumVoucherAmount ?? 0,
      maximumDiscount: maximumDiscount ?? 0,
      featured: featured ?? false,

      // scan fields automatically default
    });

    res.status(201).json({
      success: true,
      message: "Provider registered successfully",
      provider,
    });

  } catch (err) {
    console.error("❌ Provider signup error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during provider signup",
    });
  }
};


//
export const loginProvider = async (req, res) => {
  try {
    const { username, accessKey } = req.body;
    if (!username || !accessKey)
      return res
        .status(400)
        .json({ success: false, message: "Missing username or access key" });

    const provider = await Provider.findOne({ username });
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });

    if (provider.accessKey !== accessKey)
      return res
        .status(401)
        .json({ success: false, message: "Invalid access key" });

    const token = jwt.sign(
      { providerId: provider._id, username: provider.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Provider login successful",
      provider: {
        id: provider._id,
        name: provider.name,
        category: provider.category,
        logoUrl: provider.logoUrl,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Provider login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
