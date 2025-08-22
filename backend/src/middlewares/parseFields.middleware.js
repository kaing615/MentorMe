// Middleware để parse links từ string thành object khi submit form-data
export default (req, res, next) => {
  try {
    // Parse skills từ string thành array
    if (req.body.skills && typeof req.body.skills === "string") {
      req.body.skills = req.body.skills.split(",").map((s) => s.trim());
    }

    // Parse links từ JSON string thành object
    if (req.body.links && typeof req.body.links === "string") {
      // Nếu là JSON string
      if (req.body.links.startsWith("{")) {
        req.body.links = JSON.parse(req.body.links);
      } else {
        // Nếu là empty string hoặc invalid, set default
        req.body.links = {};
      }
    }

    // Đảm bảo links có structure đúng
    if (!req.body.links || typeof req.body.links !== "object") {
      req.body.links = {};
    }

    next();
  } catch (error) {
    console.error("Parse middleware error:", error);
    // Nếu parse lỗi, set default empty object
    if (req.body.links && typeof req.body.links === "string") {
      req.body.links = {};
    }
    next();
  }
};
