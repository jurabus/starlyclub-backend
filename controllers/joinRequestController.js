import JoinRequest from "../models/JoinRequest.js";

// ✅ Create new join request (merchant signup)
export const createJoinRequest = async (req, res) => {
  try {
    const { name, job, mobile, email, company, industry, branches, social, website } = req.body;

    if (!name || !job || !mobile || !email || !company || !industry || !branches || !social) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const newRequest = new JoinRequest({
      name,
      job,
      mobile,
      email,
      company,
      industry,
      branches,
      social,
      website,
      createdAt: new Date(),
    });

    await newRequest.save();
    res.status(201).json({ success: true, message: "Join request submitted successfully", request: newRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Fetch all join requests (for manual review in admin panel)
export const getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
