// controllers/providerAuthController.js
import Provider from "../models/Provider.js";
import jwt from "jsonwebtoken";

export const loginProvider = async (req, res) => {
  try {
    const { username, accessKey } = req.body;
    if (!username || !accessKey)
      return res
        .status(400)
        .json({ success: false, message: "Missing username or access key" });

    const provider = await Provider.findOne({ username });
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });

    if (provider.accessKey !== accessKey)
      return res
        .status(401)
        .json({ success: false, message: "Invalid access key" });

    const token = jwt.sign(
      { providerId: provider._id, username: provider.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Provider login successful",
      provider: {
        id: provider._id,
        name: provider.name,
        category: provider.category,
        logoUrl: provider.logoUrl,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Provider login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
