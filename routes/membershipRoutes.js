import express from "express";
import {
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  deletePlan,
  assignMembership,
  getUserCard,
  scanMembership,
  activateMembership,
} from "../controllers/membershipController.js";

const router = express.Router();

/* ---------- Plans ---------- */
router.post("/plans", createPlan);
router.get("/plans", listPlans);
router.get("/plans/:id", getPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

/* ---------- Membership lifecycle ---------- */
router.post("/assign", assignMembership); // admin only
router.post("/activate", activateMembership);

/* ---------- User ---------- */
router.get("/card/:userId", getUserCard);

/* ---------- Provider ---------- */
router.post("/scan", scanMembership);

export default router;
