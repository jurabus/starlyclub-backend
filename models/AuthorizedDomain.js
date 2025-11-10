import mongoose from "mongoose";

const authorizedDomainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    addedBy: {
      type: String, // Admin username or ID
      default: "system",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuthorizedDomain", authorizedDomainSchema);
