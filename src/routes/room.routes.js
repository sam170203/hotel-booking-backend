const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createRoom } = require('../controllers/room.controller');

const router = express.Router({ mergeParams: true });

router.post('/', authMiddleware, createRoom);

module.exports = router;
