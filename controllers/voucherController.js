// controllers/voucherController.js
import Voucher from "../models/Voucher.js";
import Provider from "../models/Provider.js";

const buildName = (providerName, faceValue, currency = "SR") =>
  `${providerName} ${currency}${faceValue} voucher`;

export const createVoucher = async (req, res) => {
  try {
    const { providerId, faceValue, price, currency, stock, logoUrl, featured, isActive } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ message: "Provider not found" });

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
      name: buildName(provider.name, faceValue, currency || "SR"),
    });

    res.status(201).json({ voucher: doc });
  } catch (e) {
    res.status(500).json({ message: "Failed to create voucher", error: e.message });
  }
};

export const listVouchers = async (req, res) => {
  try {
    const { q, providerId, featured, active } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const filter = {};
    if (providerId) filter.provider = providerId;
    if (featured !== undefined) filter.featured = featured === "true";
    if (active !== undefined) filter.isActive = active === "true";
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { providerName: new RegExp(q, "i") },
      ];
    }

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ vouchers });
  } catch (e) {
    res.status(500).json({ message: "Failed to list vouchers", error: e.message });
  }
};


export const getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ voucher });
  } catch (e) {
    res.status(500).json({ message: "Failed to get voucher", error: e.message });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.providerId) {
      const p = await Provider.findById(updates.providerId);
      if (!p) return res.status(404).json({ message: "Provider not found" });
      updates.provider = p._id;
      updates.providerName = p.name;
    }

    // Rebuild name if pricing/provider changed
    if ((updates.faceValue || updates.currency || updates.providerName) && !updates.name) {
      const finalCurrency = updates.currency || "SR";
      const finalFace = updates.faceValue;
      const finalProviderName = updates.providerName;
      if (finalProviderName && finalFace) {
        updates.name = buildName(finalProviderName, finalFace, finalCurrency);
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ voucher });
  } catch (e) {
    res.status(500).json({ message: "Failed to update voucher", error: e.message });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete voucher", error: e.message });
  }
};

// Featured shortcut
export const featuredVouchers = async (_req, res) => {
  try {
    const vouchers = await Voucher.find({ featured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ vouchers });
  } catch (e) {
    res.status(500).json({ message: "Failed to list featured vouchers", error: e.message });
  }
};
