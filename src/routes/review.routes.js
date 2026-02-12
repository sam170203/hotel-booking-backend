const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createReview } = require('../controllers/review.controller');

const router = express.Router();

router.post('/', authMiddleware, createReview);

module.exports = router;
