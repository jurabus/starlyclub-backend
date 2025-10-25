import JoinRequest from "../models/JoinRequest.js";

// 🟢 Create new join request (merchant signup)
export const createJoinRequest = async (req, res) => {
  try {
    const {
      fullName,
      jobTitle,
      countryCode,
      mobile,
      email,
      companyName,
      notes,
    } = req.body;

    if (!fullName || !jobTitle || !mobile || !email || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const newRequest = new JoinRequest({
      fullName,
      jobTitle,
      countryCode,
      mobile,
      email,
      companyName,
      notes,
      createdAt: new Date(),
    });

    await newRequest.save();

    return res.status(201).json({
      success: true,
      message: "Your request has been submitted successfully!",
      requestId: newRequest._id,
    });
  } catch (err) {
    console.error("JoinRequest Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while submitting the request.",
    });
  }
};

// 🟣 Fetch all join requests (for admin panel)
export const getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    return res.json({ success: true, requests });
  } catch (err) {
    console.error("GetJoinRequests Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch join requests.",
    });
  }
};
