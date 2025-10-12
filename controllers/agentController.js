import pool from '../db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Add a new agent
export const addAgent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      boothId,
      agentUuid,
      profilePhoto
    } = req.body;

    if (!firstName || !lastName || !email || !password || !boothId || !agentUuid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if agent UUID exists
    const uuidCheck = await pool.query('SELECT id FROM users WHERE agent_uuid=$1', [agentUuid]);
    if (uuidCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Agent UUID already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into users table
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users
        (id, first_name, last_name, email, phone, password_hash, agent_uuid, profile_photo, assigned_booth)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, firstName, lastName, email, phone || null, passwordHash, agentUuid, profilePhoto || null, boothId]
    );

    // Get agent role id
    const roleRes = await pool.query('SELECT id FROM roles WHERE name=$1', ['agent']);
    if (roleRes.rows.length === 0) {
      return res.status(500).json({ error: 'Agent role not found' });
    }
    const roleId = roleRes.rows[0].id;

    // Assign role
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)',
      [userId, roleId]
    );

    // Optional: also insert into agent_booths table
    await pool.query(
      'INSERT INTO agent_booths (agent_id, booth_id) VALUES ($1,$2)',
      [userId, boothId]
    );

    res.json({ success: true, message: 'Agent added successfully', agentId: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// 1️⃣ Get assigned booth for the agent
export const getAssignedBooth = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const result = await pool.query(
      'SELECT * FROM booths WHERE assigned_agent_id = $1',
      [agent_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2️⃣ Post location (already exists)
export const postLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, device_signature } = req.body;
    const agent_id = req.user.id;

    await pool.query(
      `INSERT INTO agent_tracking (agent_id, location, accuracy_meters, device_signature)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)`,
      [agent_id, lng, lat, accuracy, device_signature]
    );

    res.json({ message: 'Location recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3️⃣ Mark vote
export const markVote = async (req, res) => {
  try {
    const { voter_id } = req.body;
    const agent_id = req.user.id;

    await pool.query(
      `UPDATE voters SET voted = true, verified_by = $1 WHERE id = $2`,
      [agent_id, voter_id]
    );

    res.json({ message: 'Vote marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4️⃣ Get tasks assigned to agent
export const getTasks = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const result = await pool.query(
      'SELECT * FROM tasks WHERE agent_id = $1',
      [agent_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
