const { z } = require('zod');

const createBookingSchema = z.object({
  roomId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number().int().positive()
});

module.exports = {
  createBookingSchema
};
