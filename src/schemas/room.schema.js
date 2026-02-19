const { z } = require('zod');

const createRoomSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  pricePerNight: z.number().positive(),
  maxAdults: z.number().int().min(1),
  maxChildren: z.number().int().min(0).default(0),
  totalRooms: z.number().int().positive(),
  bedType: z.string().optional(),
  size: z.number().positive().optional(),
  amenities: z.array(z.string()).optional()
});

module.exports = {
  createRoomSchema
};
