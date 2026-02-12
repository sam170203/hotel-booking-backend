const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    


    // 1. check auth header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'UNAUTHORIZED', 401);
    }

    // 2. extract token
    const token = authHeader.split(' ')[1];

    // 3. verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    // 5. continue
    next();

  } catch (err) {
    return error(res, 'UNAUTHORIZED', 401);
  }
  
};

module.exports = authMiddleware;
