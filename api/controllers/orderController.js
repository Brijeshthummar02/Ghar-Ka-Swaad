const Order = require('../models/Order');
const Cook = require('../models/Cook');
const asyncHandler = require('express-async-handler');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public (should be Private in real app)
exports.createOrder = asyncHandler(async (req, res) => {
  const { userId, cookId, mealId } = req.body;
  
  const order = await Order.create({
    userId,
    cookId,
    mealId,
    status: 'Placed'
  });
  
  if (order) {
    res.status(201).json(order);
  } else {
    res.status(400);
    throw new Error('Invalid order data');
  }
});

// @desc    Rate an order
// @route   POST /api/orders/:id/rate
// @access  Public (should be Private in real app)
exports.rateOrder = asyncHandler(async (req, res) => {
  const { rating, reviewText } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Update order with rating and review
  order.rating = rating;
  order.reviewText = reviewText;
  order.status = 'Completed';
  
  await order.save();
  
  // Update cook's average rating
  const cook = await Cook.findById(order.cookId);
  
  if (cook) {
    const newRatingCount = cook.ratingCount + 1;
    const newAverageRating = 
      (cook.averageRating * cook.ratingCount + rating) / newRatingCount;
    
    cook.ratingCount = newRatingCount;
    cook.averageRating = newAverageRating;
    
    await cook.save();
  }
  
  res.json(order);
});

// @desc    Get orders by user ID
// @route   GET /api/orders/user/:userId
// @access  Public (should be Private in real app)
exports.getOrdersByUserId = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId })
    .populate('mealId')
    .populate('cookId')
    .sort({ createdAt: -1 });
  
  res.json(orders);
});

// @desc    Get orders by cook ID
// @route   GET /api/orders/cook/:cookId
// @access  Public (should be Private in real app)
exports.getOrdersByCookId = asyncHandler(async (req, res) => {
  const orders = await Order.find({ cookId: req.params.cookId })
    .populate('mealId')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  
  res.json(orders);
});

// @desc    Update order status
// @route   POST /api/orders/:id/status
// @access  Public (should be Private in real app)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['Placed', 'Completed', 'Cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  order.status = status;
  await order.save();
  
  res.json(order);
});