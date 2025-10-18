import JoinRequest from "../models/JoinRequest.js";

// 📩 Save new merchant join request
export const submitJoinRequest = async (req, res) => {
  try {
    const newRequest = new JoinRequest(req.body);
    await newRequest.save();
    res.status(201).json({ success: true, message: "Join request submitted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📋 Fetch all join requests
export const getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
