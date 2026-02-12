const jwt = require('jsonwebtoken');
const { loginSchema } = require('../schemas/auth.schema');

const bcrypt = require('bcrypt');
const { signupSchema } = require('../schemas/auth.schema');
const { success, error } = require('../utils/response');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const signup = async (req, res) => {
  //console.log('BODY:', req.body);

  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { name, email, password, role = 'customer', phone } = parsed.data;

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return error(res, 'EMAIL_ALREADY_EXISTS', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${uuidv4()}`;

    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, name, email, hashedPassword, role, phone || null]
    );

    return success(res, {
      id: userId,
      name,
      email,
      role,
      phone: phone || null
    }, 201);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};

const login = async (req, res) => {
  try {
    // 1. validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'INVALID_REQUEST', 400);
    }

    const { email, password } = parsed.data;

    // 2. find user
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return error(res, 'INVALID_CREDENTIALS', 401);
    }

    const user = result.rows[0];

    // 3. compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'INVALID_CREDENTIALS', 401);
    }

    // 4. generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. respond
    return success(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 200);

  } catch (err) {
    console.error(err);
    return error(res, 'INVALID_REQUEST', 400);
  }
};


module.exports = { 
    signup ,
    login 
};
