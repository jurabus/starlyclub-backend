// routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import bucket from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// 🧠 Configure multer to keep files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔥 Utility to delete a file from Firebase given its signed URL
async function deleteFileByUrl(fileUrl) {
  try {
    if (!fileUrl) return;

    // Decode URL & extract file path
    const decodedUrl = decodeURIComponent(fileUrl);
    const match = decodedUrl.match(/\/o\/(.+)\?alt=media/);

    if (match && match[1]) {
      const filePath = match[1];
      const file = bucket.file(filePath);
      await file.delete({ ignoreNotFound: true });
      console.log(`🗑️ Deleted file: ${filePath}`);
    } else {
      console.log("⚠️ Could not extract file path from URL:", fileUrl);
    }
  } catch (err) {
    console.warn("⚠️ Failed to delete file:", err.message);
  }
}

// 📸 POST /api/upload — Upload new image, return signed URL, delete old one if provided
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const oldUrl = req.body.oldUrl || null;
    const fileName = `uploads/${Date.now()}-${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Upload file buffer
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    // Generate signed URL (works with .firebasestorage.app and .appspot.com)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2491",
    });

    console.log("✅ Uploaded:", fileName);
    console.log("🌐 Signed URL:", signedUrl);

    // Delete old image if provided
    if (oldUrl) {
      await deleteFileByUrl(oldUrl);
    }

    res.json({ success: true, url: signedUrl });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ DELETE /api/upload — Delete an unused or canceled image
router.delete("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "Missing 'url' in request body" });
    }

    await deleteFileByUrl(url);
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
