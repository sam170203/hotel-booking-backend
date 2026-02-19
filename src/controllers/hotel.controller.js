const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { success, error } = require('../utils/response');
const { createHotelSchema } = require('../schemas/hotel.schema');

const createHotel = async (req, res) => {
  try {
    // 1. role check
    if (req.user.role !== 'owner') {
      console.log('ROLE CHECK FAILED:', req.user.role);
      return error(res, 'FORBIDDEN', 403);
    }

    // 2. validate input
    console.log('VALIDATING:', JSON.stringify(req.body));
    console.log('USER:', JSON.stringify(req.user));
    const parsed = createHotelSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('VALIDATION ERROR:', JSON.stringify(parsed.error.errors));
      console.log('FULL ERROR:', parsed.error);
      return error(res, { message: 'INVALID_REQUEST', details: parsed.error.errors }, 400);
    }
    console.log('VALIDATION PASSED');

    const { name, description, address, city, country, starRating, amenities = [], image } = parsed.data;

    // 3. insert hotel
    const hotelId = `hotel_${uuidv4()}`;

    await pool.query(
      `INSERT INTO hotels 
      (id, owner_id, name, description, city, country, amenities)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        hotelId,
        req.user.id,
        name,
        description || null,
        city,
        country,
        JSON.stringify(amenities)
      ]
    );

    // 4. respond
    return success(res, {
      id: hotelId,
      ownerId: req.user.id,
      name,
      description: description || null,
      city,
      country,
      amenities,
      rating: 0.0,
      totalReviews: 0
    }, 201);

  } catch (err) {
    console.error('HOTEL CREATE ERROR:', err);
    return error(res, { message: 'INVALID_REQUEST', error: err.message, detail: err.detail }, 400);
  }
};

const getHotels = async (req, res) => {
  try {
    const { city, country, minPrice, maxPrice, minRating } = req.query;

    let query = `
      SELECT 
        h.id,
        h.name,
        h.description,
        h.city,
        h.country,
        h.amenities,
        h.rating,
        h.total_reviews,
        COALESCE(MIN(r.price_per_night), 0) AS min_price_per_night
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotel_id
    `;

    const conditions = [];
    const values = [];

    if (city) {
      values.push(city);
      conditions.push(`LOWER(h.city) = LOWER($${values.length})`);
    }

    if (country) {
      values.push(country);
      conditions.push(`LOWER(h.country) = LOWER($${values.length})`);
    }

    if (minRating) {
      values.push(minRating);
      conditions.push(`h.rating >= $${values.length}`);
    }

    if (minPrice) {
      values.push(minPrice);
      conditions.push(`r.price_per_night >= $${values.length}`);
    }

    if (maxPrice) {
      values.push(maxPrice);
      conditions.push(`r.price_per_night <= $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += `
      GROUP BY h.id
    `;

    const result = await pool.query(query, values);

    const hotels = result.rows.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      city: hotel.city,
      country: hotel.country,
      amenities: hotel.amenities,
      rating: parseFloat(hotel.rating),
      totalReviews: hotel.total_reviews,
      minPricePerNight: parseFloat(hotel.min_price_per_night)
    }));

    return success(res, hotels, 200);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};




module.exports = {
  createHotel,
  getHotels
};
