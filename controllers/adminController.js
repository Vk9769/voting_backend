import pool from '../db.js';


export const getDashboard = async (req, res) => {
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM votes) as total_votes,
      (SELECT COUNT(*) FROM agents) as total_agents
  `);
  res.json(stats.rows[0]);
};

// Get all booths
export const getBooths = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM booths');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all agents
export const getAgents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all reports
export const getReports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Flag activity
export const flagActivity = async (req, res) => {
  try {
    const { agent_id, reason } = req.body;
    await pool.query(
      'INSERT INTO flagged_activities (agent_id, reason, created_at) VALUES ($1, $2, NOW())',
      [agent_id, reason]
    );
    res.json({ message: 'Activity flagged successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
