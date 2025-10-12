import { pool } from '../db.js';
import crypto from 'crypto';        

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
