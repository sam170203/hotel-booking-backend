const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createHotel, getHotels } = require('../controllers/hotel.controller');
const roomRoutes = require('./room.routes');

const router = express.Router();

router.post('/', authMiddleware, createHotel);

router.get('/',authMiddleware,getHotels);

router.use('/:hotelId/rooms', roomRoutes);

module.exports = router;
