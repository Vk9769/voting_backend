import pool from '../db.js';
import crypto from 'crypto';

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
