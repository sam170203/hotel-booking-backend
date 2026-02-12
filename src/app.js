const express = require('express');
const authRoutes = require('./routes/auth.routes');
const hotelRoutes = require('./routes/hotel.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/hotels', hotelRoutes);

app.use('/api/bookings', bookingRoutes);

app.use('/api/reviews', reviewRoutes);

module.exports = app;





