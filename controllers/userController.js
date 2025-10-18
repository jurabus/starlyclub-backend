import User from "../models/userModel.js";

// ➕ Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = await User.create({
      name,
      email,
      password,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

// 🔍 Fetch all users (for testing)
export const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};
