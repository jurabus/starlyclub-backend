import express from "express";
import {
  createOffer,
  getOffers,
  getFeaturedOffers,
  updateOffer,
  deleteOffer,
  getOffersByProvider 
  
} from "../controllers/offerController.js";

const router = express.Router();

router.get("/provider/:providerId", getOffersByProvider); 
// GET
router.get("/", getOffers);
router.get("/featured/list", getFeaturedOffers);

// POST (supports image upload)
router.post("/", createOffer);

// PUT (supports image upload)
router.put("/:id", updateOffer);

// DELETE
router.delete("/:id", deleteOffer);

export default router;
