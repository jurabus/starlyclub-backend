// routes/offerRoutes.js
import express from "express";
import {
  createOffer,
  getOffers,
  getFeaturedOffers,
  updateOffer,
  deleteOffer,
  getOffersByProvider,
  uploadOfferImage, // ✅ optional multer middleware (already exported)
} from "../controllers/offerController.js";

const router = express.Router();

// 🔹 CORS middleware (important for Flutter web admin)
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// 🟢 Fetch all offers
router.get("/", getOffers);

// 🟢 Fetch featured offers
router.get("/featured/list", getFeaturedOffers);

// 🟢 Fetch offers for a specific provider
router.get("/provider/:providerId", getOffersByProvider);

// 🟢 Create new offer
// You can enable uploadOfferImage if you ever switch back to local file uploads
router.post("/", /* uploadOfferImage, */ createOffer);

// 🟢 Update offer (supports optional upload)
router.put("/:id", /* uploadOfferImage, */ updateOffer);

// 🗑️ Delete offer
router.delete("/:id", deleteOffer);

export default router;
