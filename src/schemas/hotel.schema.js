const { z } = require('zod');

const createHotelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  city: z.string().min(1),
  country: z.string().min(1),
  amenities: z.array(z.string()).optional()
});

module.exports = {
  createHotelSchema
};
