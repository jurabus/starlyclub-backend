import PayoutLog from "../models/PayoutLog.js";

export const listPayoutLogs = async (_req, res) => {
  try {
    const logs = await PayoutLog.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
