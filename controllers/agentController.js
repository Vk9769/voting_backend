// controllers/agentController.js
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';


export const addAgent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      voterId,
      idType,
      idNumber,
      role,
      gender,
      dob,
      address,
      boothId
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !boothId || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check duplicates
    const emailCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (phoneCheck.rows.length > 0) return res.status(400).json({ error: 'Phone already exists' });

    // Check GOV ID
    if (idType && idNumber) {
      const govCheck = await pool.query(
        `SELECT id FROM users WHERE gov_id_type = $1 AND gov_id_number = $2`,
        [idType, idNumber]
      );
      if (govCheck.rows.length > 0) return res.status(400).json({ error: 'Government ID already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Handle uploaded profile photo
    let profilePhotoPath = null;
    if (req.file) {

      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const filename = `${uuidv4()}-${req.file.originalname}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);
      profilePhotoPath = `/uploads/${filename}`;
    }


    const userId = uuidv4();

    // Insert new user
    await pool.query(
      `INSERT INTO users
      (id, first_name, last_name, email, phone, password_hash, profile_photo, voter_id,
       gov_id_type, gov_id_number, gender, date_of_birth, address, booth_id, assigned_booth)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
      [
        userId, firstName, lastName, email, phone || null, passwordHash,
        profilePhotoPath, voterId || null, idType || null, idNumber || null,
        gender || null, dob || null, address || null, boothId
      ]
    );

    // Assign Role
    const selectedRole = role.toLowerCase();
    const roleRes = await pool.query('SELECT id FROM roles WHERE name=$1', [selectedRole]);
    if (roleRes.rows.length === 0) return res.status(400).json({ error: `Role "${selectedRole}" not found` });

    await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)`, [
      userId,
      roleRes.rows[0].id
    ]);

    // Insert into agent_booths table
    await pool.query(`INSERT INTO agent_booths (agent_id, booth_id) VALUES ($1,$2)`, [
      userId,
      boothId
    ]);

    res.json({ success: true, message: `${role} created successfully`, userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating user' });
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
