import express from "express";
import {
  createOffer, getOffers, getFeaturedOffers, getOffer, updateOffer, deleteOffer
} from "../controllers/offerController.js";
const router = express.Router();

router.post("/", createOffer);
router.get("/", getOffers);
router.get("/featured/list", getFeaturedOffers);
router.get("/:id", getOffer);
router.put("/:id", updateOffer);
router.delete("/:id", deleteOffer);

export default router;
