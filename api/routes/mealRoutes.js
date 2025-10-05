const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createMeal, getMealsByCookId, getAllMeals } = require('../controllers/mealController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), createMeal);
router.get('/', getAllMeals);
router.get('/:cookId', getMealsByCookId);

module.exports = router;