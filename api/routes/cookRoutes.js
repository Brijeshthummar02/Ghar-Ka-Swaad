const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  registerCook, 
  updateCook, 
  getCooks, 
  getCookById, 
  getNearby, 
  getByPincode 
} = require('../controllers/cookController');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.array('kitchenImages', 5), registerCook);
router.put('/:id', updateCook);
router.get('/nearby', getNearby);
router.get('/pincode/:pincode', getByPincode);
router.get('/', getCooks);
router.get('/:id', getCookById);

module.exports = router;