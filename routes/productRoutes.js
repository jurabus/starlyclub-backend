import express from "express";
import {
  getProducts,
  getProductsByProvider,
  createProduct,
  deleteProduct,
  uploadProductImage,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/provider/:providerId", getProductsByProvider);
router.post("/", uploadProductImage, createProduct);
router.delete("/:id", deleteProduct);

export default router;
