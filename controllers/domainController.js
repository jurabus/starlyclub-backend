import AuthorizedDomain from "../models/AuthorizedDomain.js";

/* ============================================================
   🧠 Get all domains
   ============================================================ */
export const getDomains = async (req, res) => {
  try {
    const domains = await AuthorizedDomain.find().sort({ domain: 1 });
    res.json({ success: true, domains });
  } catch (err) {
    console.error("getDomains error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   ➕ Add new domain
   ============================================================ */
export const addDomain = async (req, res) => {
  try {
    const { domain, addedBy } = req.body;
    if (!domain?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Domain field required" });

    const cleanDomain = domain.trim().toLowerCase();

    const exists = await AuthorizedDomain.findOne({ domain: cleanDomain });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Domain already exists" });

    const newDomain = await AuthorizedDomain.create({
      domain: cleanDomain,
      addedBy: addedBy || "admin",
    });

    res.json({ success: true, domain: newDomain });
  } catch (err) {
    console.error("addDomain error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   ✏️ Update domain
   ============================================================ */
export const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    if (!domain?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Domain field required" });

    const cleanDomain = domain.trim().toLowerCase();

    // Prevent duplicates
    const duplicate = await AuthorizedDomain.findOne({
      domain: cleanDomain,
      _id: { $ne: id },
    });
    if (duplicate)
      return res
        .status(400)
        .json({ success: false, message: "Domain already exists" });

    const updated = await AuthorizedDomain.findByIdAndUpdate(
      id,
      { domain: cleanDomain },
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Domain not found" });

    res.json({ success: true, domain: updated });
  } catch (err) {
    console.error("updateDomain error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   🗑️ Delete domain
   ============================================================ */
export const deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await AuthorizedDomain.findByIdAndDelete(id);
    if (!domain)
      return res
        .status(404)
        .json({ success: false, message: "Domain not found" });

    res.json({ success: true, message: "Domain deleted successfully" });
  } catch (err) {
    console.error("deleteDomain error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
