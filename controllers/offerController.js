import Offer from "../models/Offer.js";

export const createOffer = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getOffers = async (req, res) => {
  const offers = await Offer.find().populate("providerId").sort({ createdAt: -1 });
  res.json({ success: true, offers });
};

export const getFeaturedOffers = async (req, res) => {
  const offers = await Offer.find({ featured: true }).limit(10).populate("providerId");
  res.json({ success: true, offers });
};

export const getOffer = async (req, res) => {
  const offer = await Offer.findById(req.params.id).populate("providerId");
  res.json({ success: true, offer });
};

export const updateOffer = async (req, res) => {
  const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, offer: updated });
};

export const deleteOffer = async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Offer deleted" });
};
