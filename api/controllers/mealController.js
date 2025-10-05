const Meal = require('../models/Meal');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Public (should be Private in real app)
exports.createMeal = asyncHandler(async (req, res) => {
  const { cookId, name, description, price, calories, quantityAvailable, category, tags } = req.body;
  
  // Check if image was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a meal image');
  }
  
  // Upload image to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    folder: 'homebite/meals',
  });
  
  const meal = await Meal.create({
    cookId,
    name,
    description,
    image: uploadResult.secure_url,
    price,
    calories: calories || 0,
    quantityAvailable,
    category: category || 'Other',
    tags: tags ? JSON.parse(tags) : []
  });
  
  if (meal) {
    res.status(201).json(meal);
  } else {
    res.status(400);
    throw new Error('Invalid meal data');
  }
});

// @desc    Get meals by cook ID
// @route   GET /api/meals/:cookId
// @access  Public
exports.getMealsByCookId = asyncHandler(async (req, res) => {
  const meals = await Meal.find({
    cookId: req.params.cookId,
    isAvailable: true,
    quantityAvailable: { $gt: 0 }
  });
  
  res.json(meals);
});

// @desc    Get all available meals
// @route   GET /api/meals
// @access  Public
exports.getAllMeals = asyncHandler(async (req, res) => {
  const meals = await Meal.find({
    isAvailable: true,
    quantityAvailable: { $gt: 0 }
  }).populate({
    path: 'cookId',
    select: 'name location kitchenImageUrls averageRating'
  });
  
  res.json(meals);
});