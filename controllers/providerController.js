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
    const providers = await Provider.find().sort({ createdAt: -1 });

    const updated = providers.map((p) => ({
      ...p._doc,
      logoUrl: normalizeLogoUrl(p.logoUrl),
    }));

    res.json({ success: true, providers: updated });
  } catch (err) {
    console.error("❌ getProviders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// === In providerController.js ===
export const addProvider = async (req, res) => {
  try {
    let logoUrl = req.body.logoUrl;

    // ✅ fallback for file upload
    if (req.file) {
      logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // ✅ ensure required demo fields exist
    req.body.username = req.body.username || `demo_${Date.now()}`;
    req.body.accessKey = req.body.accessKey || `${Date.now()}`;

    // ✅ now create provider using full req.body
    const provider = new Provider({
      name: req.body.name,
      category: req.body.category,
      logoUrl: normalizeLogoUrl(logoUrl),
      description: req.body.description,
      username: req.body.username,
      accessKey: req.body.accessKey,
    });

    await provider.save();

    // ✅ Return updated list
    const providers = await Provider.find().sort({ createdAt: -1 });
    const updated = providers.map((p) => ({
      ...p._doc,
      logoUrl: normalizeLogoUrl(p.logoUrl),
    }));

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(201).json({
      success: true,
      provider,
      providers: updated,
    });
  } catch (err) {
    console.error("❌ addProvider error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};


export const updateProvider = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // ✅ If a new logo file is uploaded, use it
    if (req.file) {
      updateData.logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // ✅ Normalize URL if needed
    if (updateData.logoUrl) {
      updateData.logoUrl = normalizeLogoUrl(updateData.logoUrl);
    }

    // ✅ Get existing provider first to preserve sensitive fields
    const existingProvider = await Provider.findById(req.params.id);
    if (!existingProvider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    // ✅ Preserve required fields if not provided in body
    updateData.username = updateData.username || existingProvider.username;
    updateData.accessKey = updateData.accessKey || existingProvider.accessKey;

    // ✅ Update safely
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, provider: updatedProvider });
  } catch (err) {
    console.error("❌ updateProvider error:", err);
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
