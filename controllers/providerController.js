import Provider from "../models/Provider.js";

export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.find().sort({ createdAt: -1 });
    res.json({ success: true, providers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addProvider = async (req, res) => {
  try {
    const provider = new Provider(req.body);
    await provider.save();
    res.status(201).json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Provider deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
