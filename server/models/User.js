
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    contact: {
      platform: {
        type: String,
        enum: ["", "whatsapp", "instagram", "telegram", "email", "other"],
        default: "",
      },

      value: {
        type: String,
        trim: true,
        maxlength: [100, "Contact details cannot exceed 100 characters"],
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
