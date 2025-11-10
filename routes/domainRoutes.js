import express from "express";
import {
  getDomains,
  addDomain,
  updateDomain,
  deleteDomain,
} from "../controllers/domainController.js";

const router = express.Router();

router.get("/", getDomains);
router.post("/", addDomain);
router.put("/:id", updateDomain);
router.delete("/:id", deleteDomain);

export default router;
