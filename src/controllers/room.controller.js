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
      console.log('Room validation failed:', parsed.error);
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { 
      name, 
      description, 
      type, 
      pricePerNight, 
      maxAdults, 
      maxChildren, 
      totalRooms,
      bedType,
      size,
      amenities
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
          name,
          description || null,
          type,
          pricePerNight,
          maxAdults,
          maxChildren,
          totalRooms,
          bedType || null,
          size || null,
          JSON.stringify(amenities || []),
          totalRooms
        ]
      );
    } catch (err) {
      console.error('Database error:', err);
      if (err.code === '23505') {
        return error(res, 'ROOM_ALREADY_EXISTS', 400);
      }
      throw err;
    }

    // 5. respond
    return success(res, {
      id: roomId,
      hotelId,
      name,
      description,
      type,
      pricePerNight,
      maxAdults,
      maxChildren,
      totalRooms,
      bedType,
      size,
      amenities: amenities || []
    }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

module.exports = {
  createRoom
};
