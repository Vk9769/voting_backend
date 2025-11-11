// controllers/authController.js
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * LOGIN CONTROLLER
 * Allows login via email / phone / voter_id
 */
export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing identifier or password' });
  }

  try {
    let query, values;

    // Email
    if (/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(identifier)) {
      query = 'SELECT * FROM users WHERE email = $1';
      values = [identifier.toLowerCase()];
    } 
    // Phone (10+ digits)
    else if (/^\d{10,}$/.test(identifier)) {
      query = 'SELECT * FROM users WHERE phone = $1';
      values = [identifier];
    } 
    // Voter ID (alphanumeric, case-insensitive)
    else {
      query = 'SELECT * FROM users WHERE LOWER(voter_id) = LOWER($1)';
      values = [identifier];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Compare password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Fetch user's role (first role if multiple)
   const roleResult = await pool.query(
  `SELECT r.name, r.hierarchy
   FROM user_roles ur
   JOIN roles r ON ur.role_id = r.id
   WHERE ur.user_id = $1
   ORDER BY r.hierarchy ASC`,
  [user.id]
);

const roles = roleResult.rows.map(r => r.name);

// Default active role = highest authority = smallest hierarchy
const activeRole = roleResult.rows.length > 0 ? roleResult.rows[0].name : null;

  // Create JWT token with roles included
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: activeRole,   // highest authority role
    roles               // list of roles (if user switches role later)
  },
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
    voter_id: user.voter_id,
    status: user.status,
    roles,
    activeRole,
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
 * REGISTER DEVICE
 */
export const registerDevice = async (req, res) => {
  const { device_signature } = req.body;
  const user_id = req.user?.id;
  try {
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['device_registered', user_id]
    );
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

  // Ensure role belongs to user
  const roles = req.user.roles;
  if (!roles.includes(role)) {
    return res.status(403).json({ error: 'Role not assigned to user' });
  }

  // Regenerate token with selected role
  const newToken = jwt.sign(
    { id: req.user.id, email: req.user.email, role, roles },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ message: `Role switched to ${role}`, token: newToken });
};
