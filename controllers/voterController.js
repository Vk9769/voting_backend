import pool from '../db.js';

export const getVoterStatus = async (req, res) => {
  try {
    const { voter_id } = req.params;
    const result = await pool.query(
      'SELECT vote_status, timestamp FROM votes WHERE voter_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [voter_id]
    );
    res.json(result.rows[0] || { status: 'not_voted' });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching status' });
  }
};

export const verifyVoter = async (req, res) => {
  try {
    const { gov_id_hash } = req.body;
    const result = await pool.query('SELECT id, first_name, last_name FROM users WHERE gov_id_hash = $1', [gov_id_hash]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Voter not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Verification error' });
  }
};
