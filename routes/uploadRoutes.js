import express from "express";
import multer from "multer";
import bucket from "../firebase.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const blob = bucket.file(`uploads/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    blobStream.on("error", (err) => res.status(500).json({ error: err.message }));

    blobStream.on("finish", async () => {
      const [url] = await blob.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      });
      res.status(200).json({ url });
    });

    blobStream.end(req.file.buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
