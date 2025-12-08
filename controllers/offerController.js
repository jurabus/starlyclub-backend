// controllers/offerController.js
import Offer from "../models/Offer.js";

// CREATE an offer (Admin only)
export const createOffer = async (req, res) => {
  try {
    const { title, description, externalLink } = req.body;

    const images = req.body.images ? JSON.parse(req.body.images) : [];
    const video = req.body.video || "";

    if (images.length > 4) {
      return res
        .status(400)
        .json({ message: "Max 4 images allowed." });
    }

    const offer = await Offer.create({
      title,
      description,
      externalLink,
      images,
      video,
      createdBy: "admin",
    });

    res.status(201).json({ offer });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET paginated offers
export const getOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? 1);
    const limit = parseInt(req.query.limit ?? 20);

    const offers = await Offer.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Offer.countDocuments();

    res.json({
      offers,
      page,
      total,
      hasMore: page * limit < total,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// INCREMENT views count
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    await Offer.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
