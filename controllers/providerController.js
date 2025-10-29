import Provider from "../models/Provider.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import Offer from "../models/Offer.js";
import Voucher from "../models/Voucher.js";
// === 1️⃣ Configure local uploads ===
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadProviderImage = multer({ storage }).single("logo");

// === 2️⃣ Helper to normalize logo URLs ===
const normalizeLogoUrl = (url) => {
  if (!url) {
    // fallback demo logo
    return "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/provider.png?alt=media&token=49a7169f-c8fb-4393-a2ad-50d49a5176ca";
  }
  if (url.startsWith("http")) return url;
  return `https://starlyclub-backend.onrender.com/uploads/${url}`;
};

// === 3️⃣ CRUD OPERATIONS ===
export const getProviders = async (req, res) => {
  try {
    const { area, category, subcategory } = req.query;
    const filter = {};

    if (area) filter.area = new RegExp(area, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (subcategory) filter.subcategory = new RegExp(subcategory, "i");

    const providers = await Provider.find(filter).sort({ createdAt: -1 });

    const updated = providers.map((p) => ({
      ...p._doc,
      logoUrl: p.logoUrl?.startsWith("http")
        ? p.logoUrl
        : `https://starlyclub-backend.onrender.com/uploads/${p.logoUrl}`,
    }));

    res.json({ success: true, providers: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const createProvider = async (req, res) => {
  try {
    const provider = new Provider({
      name: req.body.name,
      category: req.body.category || "",
      subcategory: req.body.subcategory || "",
      area: req.body.area || "Cairo",
      description: req.body.description || "",
      logoUrl: req.body.logoUrl || "",
      username: req.body.username,
      accessKey: req.body.accessKey,
      featured: req.body.featured || false,
    });

    await provider.save();
    res.status(201).json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    const update = {
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory || "",
      area: req.body.area || "Cairo",
      description: req.body.description,
      logoUrl: req.body.logoUrl,
      featured: req.body.featured,
    };
    const provider = await Provider.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};



export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    // 🧹 Delete all offers linked to this provider
    const offersResult = await Offer.deleteMany({ providerId: provider._id });

    // 🧹 Delete all vouchers linked to this provider
    const vouchersResult = await Voucher.deleteMany({ provider: provider._id });

    res.json({
      success: true,
      message: `Provider deleted successfully.`,
      summary: {
        providerId: provider._id,
        offersDeleted: offersResult.deletedCount,
        vouchersDeleted: vouchersResult.deletedCount,
      },
    });

    console.log(
      `🗑️ Deleted provider ${provider.name}: ${offersResult.deletedCount} offers, ${vouchersResult.deletedCount} vouchers`
    );
  } catch (err) {
    console.error("❌ deleteProvider error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🟢 Get a single provider by ID
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch by ID or by name (fallback for string identifiers)
    let provider = await Provider.findById(id);
    if (!provider) {
      provider = await Provider.findOne({ name: id });
    }

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    const normalized = {
      ...provider._doc,
      logoUrl: provider.logoUrl?.startsWith("http")
        ? provider.logoUrl
        : `https://starlyclub-backend.onrender.com/uploads/${provider.logoUrl}`,
    };

    res.json({ success: true, provider: normalized });
  } catch (err) {
    console.error("❌ getProviderById error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
