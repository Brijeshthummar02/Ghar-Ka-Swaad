const User = require("../models/User");
const Cook = require("../models/Cook");
const asyncHandler = require("express-async-handler");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user (no hashing for MVP)
  const user = await User.create({
    name,
    email,
    password, // In a real app, this would be hashed
    phone,
    role: "user",
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Register a new cook
// @route   POST /api/auth/register-cook
// @access  Public
exports.registerCook = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log("Register cook request received:", { name, email, phone });

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Create user with cook role
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "cook",
    });

    if (!user) {
      return res.status(400).json({
        message: "Failed to create user",
      });
    }

    // Create a placeholder Cook record without requiring location data
    // This will be updated later with kitchen images and other details
    const cook = await Cook.create({
      name: user.name,
      bio: `Cook profile for ${user.name}. Profile setup pending.`,
      user: user._id,
      // kitchenImageUrls and upiId will be added when cook completes profile
      // location will use schema defaults
    });

    // This is just a placeholder - the real cook registration with images
    // will be handled by the cook controller with more details
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      cookId: cook._id,
    });
  } catch (error) {
    console.error("Error in registerCook:", error);

    // Send appropriate error response
    const statusCode = error.name === "ValidationError" ? 400 : 500;
    res.status(statusCode).json({
      message:
        error.name === "ValidationError"
          ? "Validation error during cook registration"
          : "Server error during cook registration",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
    });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // In a real app, we would compare hashed passwords
  if (user && user.password === password) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});
