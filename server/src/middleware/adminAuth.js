// server/src/middleware/adminAuth.js
import jwt from "jsonwebtoken";

export function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      console.warn("adminAuth: Missing Authorization header");
      return res.status(401).json({ message: "Authorization required" });
    }

    const token = header.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    } catch (err) {
      console.error("adminAuth: Token verify error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Support multiple possible payload formats
    const role =
      payload.role ||
      payload?.user?.role ||
      payload?.roleName ||
      payload?.permissions ||
      null;

    const adminId =
      payload.adminId ||
      payload.id ||
      payload.userId ||
      payload?.user?._id ||
      payload?.user?.id ||
      null;

    // Debug log (optional)
    console.log("adminAuth → decoded payload:", {
      adminId,
      role,
    });

    if (!role || role.toLowerCase() !== "admin") {
      console.warn("adminAuth: Access denied — role is not admin");
      return res.status(403).json({ message: "Admin access required" });
    }

    // attach to request
    req.admin = {
      ...payload,
      role: role.toLowerCase(),
      adminId,
    };

    return next();
  } catch (err) {
    console.error("adminAuth: Unexpected error:", err);
    return res.status(500).json({ message: "Internal authentication error" });
  }
}
