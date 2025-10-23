import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import joinRequestRoutes from "./routes/joinRequestRoutes.js";
import universityAuthRoutes from "./routes/universityAuthRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());

// ====== MONGO CONNECTION ======
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
connectDB();

// ====== ROUTES ======
app.get("/", (req, res) => {
  res.send("🚀 StarlyClub Backend Server Running...");
});

// API routes
app.use("/api/providers", providerRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/university", universityAuthRoutes);
app.use("/api/join-request", joinRequestRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/admin", seedRoutes);
// ====== START SERVER ======
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
