const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const hotelRoutes = require('./routes/hotel.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://sam170203.github.io'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/hotels', hotelRoutes);

app.use('/api/bookings', bookingRoutes);

app.use('/api/reviews', reviewRoutes);

module.exports = app;
