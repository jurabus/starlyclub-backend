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

// === 2️⃣ CRUD OPERATIONS ===
export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.find().sort({ createdAt: -1 });
    res.json({ success: true, providers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addProvider = async (req, res) => {
  try {
    let logoUrl = req.body.logoUrl;

    // if file uploaded, override logoUrl with server path
    if (req.file) {
      logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const provider = new Provider({
      name: req.body.name,
      category: req.body.category,
      logoUrl,
      description: req.body.description,
    });

    await provider.save();
    res.status(201).json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      updateData.logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const provider = await Provider.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Provider deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
