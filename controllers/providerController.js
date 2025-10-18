import Provider from "../models/Provider.js";

// ➕ Create
export const createProvider = async (req, res) => {
  try {
    const provider = await Provider.create(req.body);
    res.status(201).json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 📋 Get all
export const getProviders = async (req, res) => {
  const providers = await Provider.find().sort({ createdAt: -1 });
  res.json({ success: true, providers });
};

// 🧩 Get single
export const getProvider = async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, provider });
};

// ✏️ Update
export const updateProvider = async (req, res) => {
  const updated = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, provider: updated });
};

// ❌ Delete
export const deleteProvider = async (req, res) => {
  await Provider.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Provider deleted" });
};
