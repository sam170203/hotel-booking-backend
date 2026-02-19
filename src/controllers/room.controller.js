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
    console.log('Creating room with body:', JSON.stringify(req.body));
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('Room validation failed:', parsed.error);
      return error(res, { message: 'INVALID_REQUEST', details: parsed.error.errors }, 400);
    }

    const { 
      roomNumber, 
      roomType, 
      pricePerNight, 
      maxOccupancy,
      amenities,
      images
    } = parsed.data;

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
        (id, hotel_id, name, description, type, price_per_night, max_adults, max_children, total_rooms, bed_type, size, amenities, available_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          roomId,
          hotelId,
          roomNumber,           // name = roomNumber
          null,                 // description
          roomType,             // type = roomType
          pricePerNight,
          maxOccupancy,         // max_adults = maxOccupancy
          0,                    // max_children = 0 (default)
          1,                    // total_rooms = 1 (default for now)
          null,                 // bed_type
          null,                 // size
          JSON.stringify(amenities || []),
          1                     // available_rooms = total_rooms
        ]
      );
    } catch (err) {
      console.error('Database error:', err);
      if (err.code === '23505') {
        return error(res, 'ROOM_ALREADY_EXISTS', 400);
      }
      return error(res, { message: 'DATABASE_ERROR', error: err.message }, 500);
    }

    // 5. respond
    return success(res, {
      id: roomId,
      hotelId,
      roomNumber,
      roomType,
      pricePerNight,
      maxOccupancy,
      amenities: amenities || [],
      images: images || []
    }, 201);

  } catch (err) {
    console.error('Room creation error:', err);
    return error(res, { message: 'INVALID_REQUEST', error: err.message }, 400);
  }
};

module.exports = {
  createRoom
};
