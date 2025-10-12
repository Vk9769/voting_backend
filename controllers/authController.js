// controllers/authController.js
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * LOGIN CONTROLLER
 * Allows login via email / phone / UUID
 */
export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing identifier or password' });
  }

  try {
    // Detect login type: email / phone / uuid
    let query, values;
    if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(identifier)) {
      query = 'SELECT * FROM users WHERE email = $1';
      values = [identifier];
    } else if (/^[0-9]{10,}$/.test(identifier)) {
      query = 'SELECT * FROM users WHERE phone = $1';
      values = [identifier];
    } else {
      query = 'SELECT * FROM users WHERE id = $1';
      values = [identifier];
    }

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // 🔹 Fetch user's role from roles table
    const roleResult = await pool.query(
      `SELECT r.name 
   FROM user_roles ur 
   JOIN roles r ON ur.role_id = r.id 
   WHERE ur.user_id = $1 LIMIT 1`,
      [user.id]
    );

    const role = roleResult.rows[0]?.name || 'user'; // default fallback

    // Create JWT token with role included
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role, // include for front-end too
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * REFRESH TOKEN
 */
export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * REGISTER DEVICE (optional for agents)
 */
export const registerDevice = async (req, res) => {
  const { device_signature } = req.body;
  const user_id = req.user?.id;
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['device_registered', user_id]);
    res.json({ message: 'Device registered successfully', device_signature });
  } catch (err) {
    res.status(500).json({ error: 'Device registration failed' });
  }
};

/**
 * GET ROLES ASSIGNED TO USER
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await pool.query(
      `SELECT r.name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    res.json({ roles: roles.rows.map((r) => r.name) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

/**
 * SELECT ACTIVE ROLE
 */
export const selectRole = async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Missing role' });
  res.json({ message: `Active role set to ${role}` });
};
