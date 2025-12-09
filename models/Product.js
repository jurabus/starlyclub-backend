import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  category: { type: String, default: "" },      // 🔹 Added
  area: { type: String, default: "Riyad" },  
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);