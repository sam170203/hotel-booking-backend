const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { success, error } = require('../utils/response');
const { createBookingSchema } = require('../schemas/booking.schema');
const { get } = require('../app');

const createBooking = async (req, res) => {
  try {
    // 1. role check
    if (req.user.role !== 'customer') {
      return error(res, 'FORBIDDEN', 403);
    }

    // 2. validate body
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { roomId, checkInDate, checkOutDate, guests } = parsed.data;

    // 3. validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn <= today) {
      return error(res, 'INVALID_DATES', 400);
    }

    if (checkOut <= checkIn) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    // 4. fetch room + hotel
    const roomRes = await pool.query(
      `SELECT r.price_per_night, r.max_occupancy, r.hotel_id, h.owner_id
       FROM rooms r
       JOIN hotels h ON r.hotel_id = h.id
       WHERE r.id = $1`,
      [roomId]
    );

    if (roomRes.rows.length === 0) {
      return error(res, 'ROOM_NOT_FOUND', 404);
    }

    const room = roomRes.rows[0];

    // 5. owner cannot book own hotel
    if (room.owner_id === req.user.id) {
      return error(res, 'FORBIDDEN', 403);
    }

    // 6. capacity check
    if (guests > room.max_occupancy) {
      return error(res, 'INVALID_CAPACITY', 400);
    }

    // 7. overlap check
    const overlapRes = await pool.query(
      `SELECT 1 FROM bookings
       WHERE room_id = $1
       AND status = 'confirmed'
       AND ($2 < check_out_date AND $3 > check_in_date)`,
      [roomId, checkInDate, checkOutDate]
    );

    if (overlapRes.rows.length > 0) {
      return error(res, 'ROOM_NOT_AVAILABLE', 400);
    }

    // 8. calculate total price
    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    const totalPrice = nights * room.price_per_night;

    const bookingId = `booking_${uuidv4()}`;

    // 9. insert booking
    await pool.query(
      `INSERT INTO bookings
       (id, user_id, room_id, hotel_id, check_in_date, check_out_date, guests, total_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        bookingId,
        req.user.id,
        roomId,
        room.hotel_id,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice
      ]
    );

    return success(res, {
      id: bookingId,
      userId: req.user.id,
      roomId,
      hotelId: room.hotel_id,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      status: 'confirmed',
      bookingDate: new Date().toISOString()
    }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

const getBookings = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return error(res, 'FORBIDDEN', 403);
    }

    const { status } = req.query;

    let query = `
      SELECT 
        b.id,
        b.room_id,
        b.hotel_id,
        h.name AS hotel_name,
        r.room_number,
        r.room_type,
        b.check_in_date,
        b.check_out_date,
        b.guests,
        b.total_price,
        b.status,
        b.booking_date
      FROM bookings b
      JOIN hotels h ON b.hotel_id = h.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = $1
    `;

    const values = [req.user.id];

    if (status) {
      values.push(status);
      query += ` AND b.status = $2`;
    }

    const result = await pool.query(query, values);

    const bookings = result.rows.map(b => ({
      id: b.id,
      roomId: b.room_id,
      hotelId: b.hotel_id,
      hotelName: b.hotel_name,
      roomNumber: b.room_number,
      roomType: b.room_type,
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      guests: b.guests,
      totalPrice: parseFloat(b.total_price),
      status: b.status,
      bookingDate: b.booking_date
    }));

    return success(res, bookings, 200);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

const cancelBooking = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return error(res, 'FORBIDDEN', 403);
    }

    const { bookingId } = req.params;

    const result = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return error(res, 'BOOKING_NOT_FOUND', 404);
    }

    const booking = result.rows[0];

    if (booking.user_id !== req.user.id) {
      return error(res, 'FORBIDDEN', 403);
    }

    if (booking.status === 'cancelled') {
      return error(res, 'ALREADY_CANCELLED', 400);
    }

    // 24-hour rule
    const now = new Date();
    const checkIn = new Date(booking.check_in_date);

    const hoursUntilCheckIn =
      (checkIn - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 24) {
      return error(res, 'CANCELLATION_DEADLINE_PASSED', 400);
    }

    await pool.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [bookingId]
    );

    return success(res, {
      id: bookingId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    }, 200);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};



module.exports = {
  createBooking,
  getBookings,
  cancelBooking
};
