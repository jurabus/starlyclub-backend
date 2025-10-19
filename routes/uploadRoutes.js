// routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import bucket from "../firebase.js"; // ✅ uses your firebase.js config
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// 🧠 Configure multer to keep files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📸 POST /api/upload — upload image to Firebase Storage
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Upload buffer to Firebase
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    res.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
