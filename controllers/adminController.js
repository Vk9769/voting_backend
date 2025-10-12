import pool from '../db.js';

// Enhanced Dashboard stats
export const getDashboard = async (req, res) => {
  try {
    const statsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM booths) AS polls,
        (SELECT COUNT(*) FROM agents) AS agents,
        (SELECT COUNT(*) 
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'voter') AS voters,
        (SELECT COUNT(*) FROM audit_logs) AS reports
    `);

    res.json({
      success: true,
      data: statsQuery.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
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
    const result = await pool.query('SELECT * FROM audit_logs');
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
