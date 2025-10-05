const Cook = require('../models/Cook');
const User = require('../models/User');
const Order = require('../models/Order');
const Meal = require('../models/Meal');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Register a new cook with user account
// @route   POST /api/cooks/register
// @access  Public
exports.registerCook = asyncHandler(async (req, res) => {
  const { name, email, password, phone, bio, pincode, neighborhood, upiId } = req.body;
  
  // Parse arrays from JSON strings if they exist
  const specialties = req.body.specialties ? JSON.parse(req.body.specialties) : [];
  const cuisineTypes = req.body.cuisineTypes ? JSON.parse(req.body.cuisineTypes) : [];
  
  // Parse availability
  const availability = {
    morning: req.body['availability.morning'] === 'true',
    afternoon: req.body['availability.afternoon'] === 'true',
    evening: req.body['availability.evening'] === 'true',
    timeSlots: req.body['availability.timeSlots'] || ''
  };
  
  console.log('Cook registration request:', { 
    name, 
    email, 
    phone, 
    pincode, 
    neighborhood,
    specialties,
    cuisineTypes,
    availability 
  });
  
  // Check if user already exists
  const userExists = await User.findOne({ email });
  
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }
  
  // Validate required fields
  if (!name || !email || !password || !phone || !bio || !pincode || !neighborhood || !upiId) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }
  
  // For MVP, using hardcoded coordinates based on pincode
  // In a real app, we would use a geocoding service
  const coordinates = simulateGeocode(pincode);
  
  // Handle image uploads
  if (!req.files || req.files.length < 3) {
    res.status(400);
    throw new Error('Please upload at least 3 kitchen images');
  }
  
  try {
    // Upload images to Cloudinary
    const uploadPromises = req.files.map(file => 
      cloudinary.uploader.upload(file.path, {
        folder: 'homebite/kitchens',
      })
    );
    
    const uploadResults = await Promise.all(uploadPromises);
    const kitchenImageUrls = uploadResults.map(result => result.secure_url);
    
    // Create user account first
    const user = await User.create({
      name,
      email,
      password, // In production, this should be hashed
      phone,
      role: 'cook'
    });
    
    // Create cook profile with new fields
    const cook = await Cook.create({
      name,
      bio,
      specialties,
      cuisineTypes,
      availability,
      location: {
        type: 'Point',
        coordinates,
        pincode,
        neighborhood
      },
      kitchenImageUrls,
      upiId,
      user: user._id
    });
    
    if (cook) {
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        cook: cook
      });
    } else {
      // If cook creation fails, delete the user
      await User.findByIdAndDelete(user._id);
      res.status(400);
      throw new Error('Failed to create cook profile');
    }
  } catch (error) {
    console.error('Error in registerCook:', error);
    res.status(500);
    throw new Error(`Server error during cook registration: ${error.message}`);
  }
});

// @desc    Update cook profile
// @route   PUT /api/cooks/:id
// @access  Public (should be Private in real app)
exports.updateCook = asyncHandler(async (req, res) => {
  const cook = await Cook.findById(req.params.id);
  
  if (!cook) {
    res.status(404);
    throw new Error('Cook not found');
  }
  
  // Update cook profile
  const updatedCook = await Cook.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );
  
  res.json(updatedCook);
});

// @desc    Get all cooks by location
// @route   GET /api/cooks
// @access  Public
exports.getCooks = asyncHandler(async (req, res) => {
  try {
    const { pincode, lat, lon } = req.query;

    let query = {};

    // If coordinates are provided, find cooks nearby
    if (lat && lon) {
      query = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lon), parseFloat(lat)]
            },
            $maxDistance: 5000 // 5km radius
          }
        }
      };
    }
    // If pincode is provided, search by pincode
    else if (pincode) {
      query = { 'location.pincode': pincode };
    }

    // Add error handling for database connection issues
    const cooks = await Cook.find(query);

    console.log(`Found ${cooks.length} cooks matching query:`, JSON.stringify(query));

    // For each cook, find their top-rated meal
    const cooksWithTopMeal = await Promise.all(
      cooks.map(async (cook) => {
        try {
          // Get all meals for this cook
          const meals = await Meal.find({
            cookId: cook._id,
            isAvailable: true,
            quantityAvailable: { $gt: 0 }
          });

          if (meals.length === 0) {
            return { ...cook.toObject(), topRatedMeal: null };
          }

          // Calculate average rating for each meal
          const mealsWithRatings = await Promise.all(
            meals.map(async (meal) => {
              const orders = await Order.find({
                mealId: meal._id,
                status: 'Completed',
                rating: { $exists: true, $ne: null }
              });

              const averageRating = orders.length > 0
                ? orders.reduce((sum, order) => sum + order.rating, 0) / orders.length
                : 0;

              return {
                ...meal.toObject(),
                averageRating,
                ratingCount: orders.length
              };
            })
          );

          // Find the meal with the highest rating (if tie, pick the first one)
          const topRatedMeal = mealsWithRatings
            .filter(meal => meal.ratingCount > 0)
            .sort((a, b) => b.averageRating - a.averageRating)[0] || null;

          return {
            ...cook.toObject(),
            topRatedMeal
          };
        } catch (error) {
          console.error(`Error calculating top meal for cook ${cook._id}:`, error);
          return { ...cook.toObject(), topRatedMeal: null };
        }
      })
    );

    res.json(cooksWithTopMeal);
  } catch (error) {
    console.error('Error in getCooks controller:', error);
    res.status(500).json({
      message: 'Failed to fetch cooks',
      error: error.message
    });
  }
});

// @desc    Get cook by ID
// @route   GET /api/cooks/:id
// @access  Public
exports.getCookById = asyncHandler(async (req, res) => {
  try {
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid cook ID format' });
    }
    
    const cook = await Cook.findById(req.params.id).populate('user', 'name email phone');
    
    if (cook) {
      res.json(cook);
    } else {
      res.status(404).json({ message: 'Cook not found' });
    }
  } catch (error) {
    console.error('Error in getCookById controller:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cook details', 
      error: error.message 
    });
  }
});

// @desc    Get nearby cooks based on lat/lng
// @route   GET /api/cooks/nearby
// @access  Public
exports.getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 5 } = req.query;
  
  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const cooks = await Cook.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });

  // Calculate distance for each cook
  const cooksWithDistance = cooks.map(cook => {
    const cookObj = cook.toObject();
    cookObj.distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      cook.location.coordinates[1],
      cook.location.coordinates[0]
    );
    return cookObj;
  });

  res.json(cooksWithDistance);
});

// @desc    Get cooks by pincode
// @route   GET /api/cooks/pincode/:pincode
// @access  Public
exports.getByPincode = asyncHandler(async (req, res) => {
  const { pincode } = req.params;
  
  if (!pincode) {
    res.status(400);
    throw new Error('Pincode is required');
  }

  const cooks = await Cook.find({ 'location.pincode': pincode });
  res.json(cooks);
});

// Helper function to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  return distance;
}

// Helper function to simulate geocoding
function simulateGeocode(pincode) {
  // This is a simple simulation - in a real app we'd use a geocoding service
  // For now we'll return random coordinates in India
  const pincodeMap = {
    '400001': [72.8311, 18.9220], // Mumbai
    '110001': [77.2090, 28.6139], // Delhi
    '600001': [80.2707, 13.0827], // Chennai
    '700001': [88.3639, 22.5726], // Kolkata
    '560001': [77.5946, 12.9716], // Bangalore,
    '382350': [72.6369, 23.2156]  // Ahmedabad/Gandhinagar area
  };
  
  return pincodeMap[pincode] || [
    72 + Math.random() * 6, // longitude between ~72-78
    18 + Math.random() * 12  // latitude between ~18-30
  ];
}