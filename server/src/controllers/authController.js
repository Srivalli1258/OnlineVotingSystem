// server/src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const JWT_EXPIRES = "7d";

// ---------- Register (unchanged) ----------
export async function register(req, res) {
  try {
    const { name, email, password, phone, dob, gender, address, idNumber } = req.body;

    if (!name || !email || !password || !phone || !dob || !gender || !address || !idNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "ID Proof file is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { idNumber }]
    });
    if (existing) {
      return res.status(400).json({ message: "Email or Aadhaar already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const createdUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone,
      dob: new Date(dob),
      gender,
      address,
      idNumber,
      idProof: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      role: "voter"
    });

    const token = jwt.sign(
      { id: createdUser._id.toString(), role: createdUser.role || "voter" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const safeUser = {
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      idNumber: createdUser.idNumber,
      role: createdUser.role
    };

    return res.status(201).json({
      message: "Registration successful",
      user: safeUser,
      token
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}

// ---------- Login (robust & debug-friendly) ----------
export async function login(req, res) {
  try {
    // Debug logging — remove after you confirm requests are correct
    console.log("=== AUTH LOGIN ATTEMPT ===");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Raw body:", req.body);

    // accept many possible field names from frontend
    const body = req.body || {};
    const aadhar = (body.aadhar || body.aadhaar || body.idNumber || body.id || body.aadhaarOrEmail || body.identifier || "").toString().trim();
    const password = (body.password || "").toString();

    // Validate
    if (!aadhar || !password) {
      // give a precise message — help the frontend
      const missing = [];
      if (!aadhar) missing.push("aadhar/idNumber");
      if (!password) missing.push("password");
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    // Try to find user by idNumber (Aadhaar) first, then email
    let user = null;
    user = await User.findOne({ idNumber: aadhar });
    if (!user) {
      // try email
      user = await User.findOne({ email: String(aadhar).toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: " credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log(password, user.passwordHash);
      return res.status(401).json({ message: "invalid" });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role || "voter" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      idNumber: user.idNumber,
      role: user.role
    };

    console.log("AUTH LOGIN SUCCESS:", user._id.toString());
    return res.json({ message: "Login successful", user: safeUser, token });
  } catch (err) {
    console.error("Login error:", err);
    console.log("Occurs error");
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}
