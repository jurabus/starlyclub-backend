import JoinRequest from "../models/JoinRequest.js";

// ➕ Store new join request
export const createJoinRequest = async (req, res) => {
  try {
    const newRequest = await JoinRequest.create(req.body);
    res.status(201).json({ success: true, data: newRequest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 📋 Fetch all requests
export const getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ submittedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
