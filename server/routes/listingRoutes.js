
const express = require("express");
const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get available marketplace listings and seller contact preferences.
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find({
      availability: "available",
    })
      .sort({ createdAt: -1 })
      .lean();

    const sellerIds = [
      ...new Set(
        listings
          .map((listing) => listing.sellerId?.toString())
          .filter(Boolean)
      ),
    ];

    const sellers = sellerIds.length
      ? await User.find({ _id: { $in: sellerIds } })
          .select("_id contact")
          .lean()
      : [];

    const sellersById = new Map(
      sellers.map((seller) => [seller._id.toString(), seller])
    );

    const listingsWithContact = listings.map((listing) => {
      const seller = listing.sellerId
        ? sellersById.get(listing.sellerId.toString())
        : null;

      const contact = seller?.contact;

      return {
        ...listing,
        sellerContact:
          contact?.platform && contact?.value
            ? {
                platform: contact.platform,
                value: contact.value,
              }
            : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: listingsWithContact.length,
      listings: listingsWithContact,
    });
  } catch (error) {
    console.error("Retrieve listings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve listings",
    });
  }
});

// Get the authenticated user's listings.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const listings = await Listing.find({
      sellerId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Retrieve own listings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your listings",
    });
  }
});

// Create a listing without images.
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, price, category, condition } = req.body;

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      seller: req.user.name,
      sellerId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create listing",
    });
  }
});

// Mark a listing as sold. Only its owner may do this.
router.patch("/:id/sold", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findOne({
      _id: id,
      sellerId: req.user._id,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found or you do not own it",
      });
    }

    if (listing.availability === "sold") {
      return res.status(400).json({
        success: false,
        message: "This listing is already marked as sold",
      });
    }

    listing.availability = "sold";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing marked as sold",
      listing,
    });
  } catch (error) {
    console.error("Mark listing sold error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark listing as sold",
    });
  }
});

// Update listing text fields.
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "category",
      "condition",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide listing details to update",
      });
    }

    const listing = await Listing.findOne({
      _id: id,
      sellerId: req.user._id,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found or you do not own it",
      });
    }

    for (const [field, value] of Object.entries(updates)) {
      listing[field] = value;
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update listing",
    });
  }
});

// Delete a listing.
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findOneAndDelete({
      _id: id,
      sellerId: req.user._id,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found or you do not own it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete listing",
    });
  }
});

module.exports = router;
