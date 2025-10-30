import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";

// ========== CREATE VOUCHER ==========
export const createVoucher = async (req, res) => {
  try {
    const {
      providerId,
      faceValue,
      price,
      stock,
      currency,
      featured,
      isActive,
      name,
      category,
      subcategory,
      area,
      logoUrl,
    } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ error: "Provider not found" });

    const voucherName =
      name ||
      `${provider.name} Voucher ${faceValue || ""} ${currency || "SR"}`.trim();

    const doc = await Voucher.create({
      provider: provider._id,
      providerName: provider.name,
      faceValue,
      price,
      currency: currency || "SR",
      stock: stock ?? 0,
      logoUrl: logoUrl || provider.logoUrl || "",
      featured: !!featured,
      isActive: isActive !== false,
      name: voucherName,
      category: category || provider.category || "General",
      subcategory: subcategory || provider.subcategory || "",
      area: area || provider.area || "Jeddah",
    });

    res.status(201).json({ success: true, voucher: doc });
  } catch (err) {
    console.error("❌ Create voucher error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== LIST ALL VOUCHERS ==========
export const listVouchers = async (req, res) => {
  try {
    const { area, category, subcategory, featured, limit = 50, page = 1 } =
      req.query;

    const filter = { isActive: true };

    if (area)
      filter.area = new RegExp(area, "i");
    if (category)
      filter.category = new RegExp(category, "i");
    if (subcategory)
      filter.subcategory = new RegExp(subcategory, "i");
    if (featured !== undefined)
      filter.featured = featured === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ vouchers });
  } catch (err) {
    console.error("❌ List vouchers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== VOUCHERS BY PROVIDER ==========
export const providerVouchers = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured, area, limit = 50, page = 1 } = req.query;

    const filter = {
      provider: id,
      isActive: true,
    };

    if (featured !== undefined)
      filter.featured = featured === "true";
    if (area)
      filter.area = new RegExp(area, "i");

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ vouchers });
  } catch (err) {
    console.error("❌ Provider vouchers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== GET SINGLE VOUCHER ==========
export const getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json({ voucher });
  } catch (err) {
    console.error("❌ Get voucher error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== UPDATE VOUCHER ==========
export const updateVoucher = async (req, res) => {
  try {
    const updated = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Voucher not found" });
    res.json({ success: true, voucher: updated });
  } catch (err) {
    console.error("❌ Update voucher error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== DELETE VOUCHER ==========
export const deleteVoucher = async (req, res) => {
  try {
    const deleted = await Voucher.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Voucher not found" });
    res.json({ success: true, message: "Voucher deleted" });
  } catch (err) {
    console.error("❌ Delete voucher error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========== FEATURED VOUCHERS ==========
export const featuredVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      featured: true,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ vouchers });
  } catch (err) {
    console.error("❌ Featured vouchers error:", err);
    res.status(500).json({ error: err.message });
  }
};
