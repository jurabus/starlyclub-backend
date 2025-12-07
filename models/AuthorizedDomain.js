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
    universityName: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: String,
      default: "system",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuthorizedDomain", authorizedDomainSchema);
