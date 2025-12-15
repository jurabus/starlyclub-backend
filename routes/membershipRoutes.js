// routes/membershipRoutes.js
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
  renewMembership,
  createMembershipPayment
} from "../controllers/membershipController.js";

const router = express.Router();

/* ---------- Admin: Plans ---------- */
router.post("/plans", createPlan);        // create plan
router.post("/payment", createMembershipPayment);

router.post("/renew", renewMembership);
router.get("/plans", listPlans);          // list plans
router.get("/plans/:id", getPlan);        // get one plan
router.put("/plans/:id", updatePlan);     // update plan
router.delete("/plans/:id", deletePlan);  // delete plan

/* ---------- Admin: Assign membership to user ---------- */
router.post("/assign", assignMembership);

/* ---------- User: Get card + QR token ---------- */
router.get("/card/:userId", getUserCard);

/* ---------- Provider: Scan membership card ---------- */
router.post("/scan", scanMembership);

export default router;
