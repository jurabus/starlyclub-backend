import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: String,
  description: String,
  category: String,
  subcategory: { type: String, default: "" },  // 🔹 Added
  area: { type: String, default: "Cairo" }, 
  rating: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, unique: true, required: true },
  accessKey: { type: String, required: true },
  // PATCH for models/Provider.js
// Add the following fields into your existing providerSchema definition:

maximumDiscount: { type: Number, default: 0, min: 0, max: 100 }, // provider's max discount %
scannedCardsCount: { type: Number, default: 0 },                  // total successful membership scans
scanHistory: [
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    membershipType: String, // plan name
    discountPercent: Number,
    scannedAt: { type: Date, default: Date.now },
  },
],

});

export default mongoose.model("Provider", providerSchema);
