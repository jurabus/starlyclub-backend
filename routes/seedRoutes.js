import express from "express";
import seedDemoData from "../scripts/seedDemoData.js";

const router = express.Router();

router.post("/seed-demo", async (req, res) => {
  try {
    await seedDemoData();
    res.json({
      success: true,
      message: "✅ Demo data seeded successfully with featured offers",
    });
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
