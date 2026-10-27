
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

const CONTACT_PLATFORMS = [
  "whatsapp",
  "instagram",
  "telegram",
  "email",
  "other",
];

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from server/.env");
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// GET /api/auth/contact
// Get the logged-in user's contact preference.
router.get("/contact", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("contact");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      contact: user.contact || { platform: "", value: "" },
    });
  } catch (error) {
    console.error("Get contact preference error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve contact preference",
    });
  }
});

// PUT /api/auth/contact
// Save or update the logged-in user's contact preference.
router.put("/contact", authMiddleware, async (req, res) => {
  try {
    const { platform, value } = req.body;

    if (
      typeof platform !== "string" ||
      !CONTACT_PLATFORMS.includes(platform)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a supported contact platform",
      });
    }

    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact details are required",
      });
    }

    const normalizedValue = value.trim();

    if (normalizedValue.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Contact details cannot exceed 100 characters",
      });
    }

    if (platform === "email") {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!validEmail.test(normalizedValue)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid contact email address",
        });
      }
    }

    if (platform === "whatsapp" && !/^\+?[0-9\s()-]{7,20}$/.test(normalizedValue)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid WhatsApp phone number",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.contact = {
      platform,
      value: normalizedValue,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Contact preference saved successfully",
      contact: user.contact,
    });
  } catch (error) {
    console.error("Update contact preference error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update contact preference",
    });
  }
});

module.exports = router;
