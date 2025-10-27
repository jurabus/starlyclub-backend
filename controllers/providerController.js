import Provider from "../models/Provider.js";
import multer from "multer";
import path from "path";
import fs from "fs";

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

    // ✅ Use uploaded file if present
    if (req.file) {
      logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const provider = new Provider({
      name: req.body.name,
      category: req.body.category,
      logoUrl: normalizeLogoUrl(logoUrl),
      description: req.body.description,
    });

    await provider.save();

    // ✅ Return updated provider list to sync with Flutter
    const providers = await Provider.find().sort({ createdAt: -1 });

    const updated = providers.map((p) => ({
      ...p._doc,
      logoUrl: normalizeLogoUrl(p.logoUrl),
    }));
	res.setHeader("Access-Control-Allow-Origin", "*");


    res.status(201).json({
      success: true,
      provider,
      providers: updated, // 👈 Flutter uses this
    });
  } catch (err) {
    console.error("❌ addProvider error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      updateData.logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    if (updateData.logoUrl) {
      updateData.logoUrl = normalizeLogoUrl(updateData.logoUrl);
    }

    const provider = await Provider.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({ success: true, provider });
  } catch (err) {
    console.error("❌ updateProvider error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Provider deleted" });
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
