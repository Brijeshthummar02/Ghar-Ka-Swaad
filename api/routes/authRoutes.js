const express = require('express');
const router = express.Router();
const { register, registerCook, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/register-cook', registerCook);
router.post('/login', login);

module.exports = router;