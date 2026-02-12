const { z } = require('zod');

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  roomType: z.string().min(1),
  pricePerNight: z.number().positive(),
  maxOccupancy: z.number().int().positive()
});

module.exports = {
  createRoomSchema
};
