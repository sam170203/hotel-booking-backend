const { z } = require('zod');

const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.string().min(1, "Room type is required"),
  pricePerNight: z.coerce.number().positive("Price must be positive"),
  maxOccupancy: z.coerce.number().int().min(1, "Max occupancy must be at least 1"),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([])
});

module.exports = {
  createRoomSchema
};
