import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    link: { type: String, default: "" }, // optional
    order: { type: Number, default: 0 }, // for sorting
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
