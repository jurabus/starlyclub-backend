// routes/offers.js
import express from "express";
import {
  createOffer,
  getOffers,
  incrementViews,
} from "../controllers/offerController.js";

const router = express.Router();

// CREATE (admin only)
router.post("/", createOffer);

// LIST paginated
router.get("/", getOffers);

// VIEW counter
router.put("/view/:id", incrementViews);

export default router;
