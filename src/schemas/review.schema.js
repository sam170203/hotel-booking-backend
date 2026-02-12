const { z } = require('zod');

const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});

module.exports = { createReviewSchema };
