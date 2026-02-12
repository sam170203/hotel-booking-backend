const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { success, error } = require('../utils/response');
const { createReviewSchema } = require('../schemas/review.schema');

const createReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return error(res, 'FORBIDDEN', 403);
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { bookingId, rating, comment } = parsed.data;

    const bookingRes = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return error(res, 'BOOKING_NOT_FOUND', 404);
    }

    const booking = bookingRes.rows[0];

    if (booking.user_id !== req.user.id) {
      return error(res, 'FORBIDDEN', 403);
    }

    if (booking.status !== 'confirmed') {
      return error(res, 'BOOKING_NOT_ELIGIBLE', 400);
    }

    // Check if checkout date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkOut = new Date(booking.check_out_date);

    if (!(checkOut < today)) {
      return error(res, 'BOOKING_NOT_ELIGIBLE', 400);
    }

    // Check duplicate review
    const duplicate = await pool.query(
      `SELECT 1 FROM reviews WHERE booking_id = $1`,
      [bookingId]
    );

    if (duplicate.rows.length > 0) {
      return error(res, 'ALREADY_REVIEWED', 400);
    }

    const reviewId = `review_${uuidv4()}`;

    await pool.query(
      `INSERT INTO reviews
       (id, user_id, hotel_id, booking_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        reviewId,
        req.user.id,
        booking.hotel_id,
        bookingId,
        rating,
        comment || null
      ]
    );

    // Update hotel rating
    const hotelRes = await pool.query(
      `SELECT rating, total_reviews FROM hotels WHERE id = $1`,
      [booking.hotel_id]
    );

    const hotel = hotelRes.rows[0];

    const newTotalReviews = hotel.total_reviews + 1;

    const newRating =
      ((hotel.rating * hotel.total_reviews) + rating) /
      newTotalReviews;

    await pool.query(
      `UPDATE hotels
       SET rating = $1,
           total_reviews = $2
       WHERE id = $3`,
      [newRating, newTotalReviews, booking.hotel_id]
    );

    return success(res, {
      id: reviewId,
      userId: req.user.id,
      hotelId: booking.hotel_id,
      bookingId,
      rating,
      comment: comment || null,
      createdAt: new Date().toISOString()
    }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

module.exports = { createReview };
