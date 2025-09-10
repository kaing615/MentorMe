// Parse skills & links từ form-data/JSON thành định dạng chuẩn
const toArray = (val) => {
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.map(String).map(x => x.trim()).filter(Boolean) : [];
      } catch {}
    }
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }
  if (val == null) return [];
  return [String(val).trim()].filter(Boolean);
};

const toObject = (val) => {
  if (val && typeof val === "object" && !Array.isArray(val)) return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return {};
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        const obj = JSON.parse(s);
        return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
      } catch {}
    }
    const out = {};
    for (const pair of s.split(",").map(p => p.trim()).filter(Boolean)) {
      const idx = pair.indexOf(":");
      if (idx > -1) {
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (key) out[key] = value;
      }
    }
    return out;
  }
  return {};
};

export default function parseProfileFields(req, _res, next) {
  try {
    if (req.body) {
      req.body.skills = toArray(req.body.skills);
      req.body.links = toObject(req.body.links);
    }
    next();
  } catch (err) {
    console.error("Parse middleware error:", err);
    if (req.body) {
      if (typeof req.body.links === "string") req.body.links = {};
      if (!Array.isArray(req.body.skills)) req.body.skills = toArray(req.body.skills);
    }
    next();
  }
}
