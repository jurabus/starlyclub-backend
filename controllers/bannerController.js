import Banner from "../models/Banner.js";

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, items: banners });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { imageUrl, link } = req.body;

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return res.status(400).json({
        success: false,
        message: "Valid imageUrl required",
      });
    }

    const last = await Banner.findOne().sort({ order: -1 });
    const newOrder = last ? last.order + 1 : 0;

    const banner = await Banner.create({
      imageUrl,
      link: link || "",
      order: newOrder,
    });

    res.status(201).json({ success: true, item: banner });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });

    const { imageUrl, link, order } = req.body;

    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (link !== undefined) banner.link = link;
    if (order !== undefined) banner.order = order;

    await banner.save();

    res.json({ success: true, item: banner });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });

    await banner.deleteOne();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
