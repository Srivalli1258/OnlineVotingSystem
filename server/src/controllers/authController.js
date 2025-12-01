// server/src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

// ---------- Register ----------
export async function register(req, res) {
  try {
    const { name, email, password, phone, dob, gender, address, idNumber } = req.body;

    // mandatory checks
    if (!name || !email || !password || !phone || !dob || !gender || !address || !idNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "ID Proof file is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // create user
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
      { userId: createdUser._id },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
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

// ---------- Login ----------
export async function login(req, res) {
  try {
    const { aadhar, password, isAdmin } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });

    let user;

    if (isAdmin) {
      // admin login: treat aadhar as email for admins
      if (!aadhar) return res.status(400).json({ message: "Admin email is required" });
      const email = String(aadhar).trim().toLowerCase();
      user = await User.findOne({ email, role: "admin" });
      if (!user) return res.status(400).json({ message: "Invalid admin credentials" });
    } else {
      // voter login: lookup by idNumber (Aadhaar)
      if (!aadhar) return res.status(400).json({ message: "Aadhaar number is required" });
      user = await User.findOne({ idNumber: aadhar });
      if (!user) return res.status(400).json({ message: "Invalid Aadhaar or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid Aadhaar or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      idNumber: user.idNumber,
      role: user.role
    };

    return res.json({ message: "Login successful", user: safeUser, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}
