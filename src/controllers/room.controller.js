const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { success, error } = require('../utils/response');
const { createRoomSchema } = require('../schemas/room.schema');

const createRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // 1. role check
    if (req.user.role !== 'owner') {
      return error(res, 'FORBIDDEN', 403);
    }

    // 2. validate body
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { roomNumber, roomType, pricePerNight, maxOccupancy } = parsed.data;

    // 3. check hotel exists & ownership
    const hotelRes = await pool.query(
      'SELECT owner_id FROM hotels WHERE id = $1',
      [hotelId]
    );

    if (hotelRes.rows.length === 0) {
      return error(res, 'HOTEL_NOT_FOUND', 404);
    }

    if (hotelRes.rows[0].owner_id !== req.user.id) {
      return error(res, 'FORBIDDEN', 403);
    }

    // 4. insert room
    const roomId = `room_${uuidv4()}`;

    try {
      await pool.query(
        `INSERT INTO rooms 
        (id, hotel_id, room_number, room_type, price_per_night, max_occupancy)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          roomId,
          hotelId,
          roomNumber,
          roomType,
          pricePerNight,
          maxOccupancy
        ]
      );
    } catch (err) {
      if (err.code === '23505') {
        return error(res, 'ROOM_ALREADY_EXISTS', 400);
      }
      throw err;
    }

    // 5. respond
    return success(res, {
      id: roomId,
      hotelId,
      roomNumber,
      roomType,
      pricePerNight,
      maxOccupancy
    }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

module.exports = {
  createRoom
};
