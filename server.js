import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import joinRequestRoutes from "./routes/joinRequestRoutes.js";
import universityAuthRoutes from "./routes/universityAuthRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// ✅ MongoDB connection
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

// ✅ Route registration (MUST come *after* app is defined)
app.use("/api/providers", providerRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/university", universityAuthRoutes);
app.use("/api/join-request", joinRequestRoutes);

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 StarlyClub Backend Server Running...");
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
