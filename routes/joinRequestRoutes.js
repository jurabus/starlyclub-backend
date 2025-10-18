import express from "express";
import {
  createJoinRequest,
  getJoinRequests,
} from "../controllers/joinRequestController.js";

const router = express.Router();

router.post("/", createJoinRequest);
router.get("/", getJoinRequests);

export default router;
