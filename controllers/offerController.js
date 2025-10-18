import Offer from "../models/Offer.js";
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

export const uploadOfferImage = multer({ storage }).single("image");

// === 2️⃣ CRUD OPERATIONS ===
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().populate("providerId").sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFeaturedOffers = async (req, res) => {
  try {
    const offers = await Offer.find().limit(10).populate("providerId");
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOffer = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const offer = new Offer({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      imageUrl,
      discountPercent: req.body.discountPercent,
      providerId: req.body.providerId,
    });

    await offer.save();
    res.status(201).json({ success: true, offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({ success: true, offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
