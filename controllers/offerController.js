// controllers/offerController.js
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
    const { area, category, subcategory } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const filter = {};
    if (area) filter.area = new RegExp(area, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (subcategory) filter.subcategory = new RegExp(subcategory, "i");

    const offers = await Offer.find(filter)
      .populate("providerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const updated = offers.map((o) => ({
      ...o._doc,
      imageUrl: o.imageUrl?.startsWith("http")
        ? o.imageUrl
        : o.imageUrl
        ? `https://starlyclub-backend.onrender.com/uploads/${o.imageUrl}`
        : "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/offer.png?alt=media&token=aa78ae95-7815-425a-8b57-b72fbdaf8646",
    }));

    res.json({ success: true, offers: updated });
  } catch (err) {
    console.error("❌ getOffers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



export const getFeaturedOffers = async (req, res) => {
  try {
    const offers = await Offer.find().limit(10).populate("providerId");

    const updated = offers.map((o) => ({
      ...o._doc,
      imageUrl: o.imageUrl?.startsWith("http")
        ? o.imageUrl
        : `https://starlyclub-backend.onrender.com/uploads/${o.imageUrl}`,
    }));

    res.json({ success: true, offers: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get offers for a specific provider
export const getOffersByProvider = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    if (!providerId) {
      return res.status(400).json({ success: false, message: "Provider ID missing" });
    }

    const offers = await Offer.find({ providerId }).populate("providerId").sort({ createdAt: -1 });

    const updated = offers.map((o) => ({
      ...o._doc,
      imageUrl: o.imageUrl?.startsWith("http")
        ? o.imageUrl
        : o.imageUrl
        ? `https://starlyclub-backend.onrender.com/uploads/${o.imageUrl}`
        : "https://firebasestorage.googleapis.com/v0/b/starleyclub.firebasestorage.app/o/offer.png?alt=media&token=aa78ae95-7815-425a-8b57-b72fbdaf8646",
    }));

    res.json({ success: true, offers: updated });
  } catch (err) {
    console.error("❌ Error in getOffersByProvider:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOffer = async (req, res) => {
  try {
    const offer = new Offer({
      name: req.body.name,
      category: req.body.category || "",
      subcategory: req.body.subcategory || "",
      area: req.body.area || "Cairo",
      description: req.body.description || "",
      imageUrl: req.body.imageUrl || "",
      discountPercent: req.body.discountPercent || 0,
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
    const update = {
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory || "",
      area: req.body.area || "Cairo",
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      discountPercent: req.body.discountPercent,
      providerId: req.body.providerId,
    };
    const offer = await Offer.findByIdAndUpdate(req.params.id, update, { new: true });
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
