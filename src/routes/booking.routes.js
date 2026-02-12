const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createBooking, getBookings, cancelBooking } =
  require('../controllers/booking.controller');


const router = express.Router();

router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getBookings);
router.put('/:bookingId/cancel', authMiddleware, cancelBooking);


module.exports = router;
