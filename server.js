import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import joinRequestRoutes from "./routes/joinRequestRoutes.js";
import universityAuthRoutes from "./routes/universityAuthRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import providerAuthRoutes from "./routes/providerAuthRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import domainRoutes from "./routes/domainRoutes.js";
import voucherQrRoutes from "./routes/voucherQrRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import "./cron/payoutCron.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
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
app.enable("trust proxy")
// API routes

app.use("/api/domains", domainRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/qr/voucher", voucherQrRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/provider-auth", providerAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/university", universityAuthRoutes);
app.use("/api/join-request", joinRequestRoutes);
app.use("/api/upload", uploadRoutes);
// ====== START SERVER ======
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
