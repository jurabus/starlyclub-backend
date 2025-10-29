import Product from "../models/Product.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadProductImage = multer({ storage }).single("image");

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://starlyclub-backend.onrender.com/uploads/${url}`;
};

export const getProducts = async (req, res) => {
  try {
    const { area, category, subcategory } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const filter = {};
    if (area) filter.area = new RegExp(area, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (subcategory) filter.subcategory = new RegExp(subcategory, "i");

    const products = await Product.find(filter)
      .populate("providerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      products: products.map((p) => ({
        ...p._doc,
        imageUrl: p.imageUrl?.startsWith("http")
          ? p.imageUrl
          : `https://starlyclub-backend.onrender.com/uploads/${p.imageUrl}`,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getProductsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const products = await Product.find({ providerId }).populate("providerId");
    res.json({
      success: true,
      products: products.map((p) => ({
        ...p._doc,
        imageUrl: normalizeImageUrl(p.imageUrl),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    if (req.file)
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const product = new Product({
      name: req.body.name,
      imageUrl,
      oldPrice: req.body.oldPrice,
      newPrice: req.body.newPrice,
      providerId: req.body.providerId,
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
