const { z } = require('zod');

const createHotelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  starRating: z.coerce.number().int().min(1).max(5).optional().default(3),
  amenities: z.array(z.string()).optional().default([]),
  image: z.string().optional().default("")
});

module.exports = {
  createHotelSchema
};
