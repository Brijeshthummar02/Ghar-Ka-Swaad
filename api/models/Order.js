const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cook',
    required: true
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['Placed', 'Completed', 'Cancelled'],
    default: 'Placed'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  reviewText: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);