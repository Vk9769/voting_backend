import pool from '../db.js';

// ==================== DASHBOARD OVERVIEW ====================
export const getDashboard = async (req, res) => {
  try {
    const statsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM booths) AS polls,
        (SELECT COUNT(*) 
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'agent') AS agents,
        (SELECT COUNT(*) 
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'voter') AS voters,
        (SELECT COUNT(*) FROM audit_logs) AS reports
    `);

    res.json({ success: true, data: statsQuery.rows[0] });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== FETCH DATA ====================

// All booths
export const getBooths = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM booths ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching booths:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// All agents (from users + roles)
export const getAgents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'agent'
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// All reports
export const getReports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== FLAG ACTIVITY ====================
export const flagActivity = async (req, res) => {
  try {
    const { agent_id, reason } = req.body;
    if (!agent_id || !reason) {
      return res.status(400).json({ error: 'agent_id and reason are required' });
    }

    await pool.query(
      'INSERT INTO flagged_activities (agent_id, reason, created_at) VALUES ($1, $2, NOW())',
      [agent_id, reason]
    );

    res.json({ message: 'Activity flagged successfully' });
  } catch (err) {
    console.error('Error flagging activity:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== BOOTH ASSIGNMENTS ====================

// Assign an agent to a booth
export const assignAgentToBooth = async (req, res) => {
  const { agent_id, booth_id } = req.body;
  if (!agent_id || !booth_id) {
    return res.status(400).json({ error: 'agent_id and booth_id are required' });
  }

  try {
    // Check if agent role is valid
    const roleCheck = await pool.query(
      `SELECT r.name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`, [agent_id]
    );

    if (!roleCheck.rows.find(r => r.name === 'agent')) {
      return res.status(400).json({ error: 'User is not an agent' });
    }

    await pool.query(`
      INSERT INTO agent_booths (agent_id, booth_id)
      VALUES ($1, $2)
      ON CONFLICT (agent_id, booth_id) DO NOTHING
    `, [agent_id, booth_id]);

    res.json({ success: true, message: 'Agent assigned to booth successfully' });
  } catch (err) {
    console.error('Error assigning agent:', err);
    res.status(500).json({ error: 'Server error assigning agent' });
  }
};

// Assign a voter to a booth
export const assignVoterToBooth = async (req, res) => {
  const { voter_id, booth_id } = req.body;
  if (!voter_id || !booth_id) {
    return res.status(400).json({ error: 'voter_id and booth_id are required' });
  }

  try {
    // Check if voter role is valid
    const roleCheck = await pool.query(
      `SELECT r.name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`, [voter_id]
    );

    if (!roleCheck.rows.find(r => r.name === 'voter')) {
      return res.status(400).json({ error: 'User is not a voter' });
    }

    await pool.query(`
      INSERT INTO voter_booth_assignments (voter_id, booth_id)
      VALUES ($1, $2)
      ON CONFLICT (voter_id) DO UPDATE SET booth_id = EXCLUDED.booth_id
    `, [voter_id, booth_id]);

    res.json({ success: true, message: 'Voter assigned to booth successfully' });
  } catch (err) {
    console.error('Error assigning voter:', err);
    res.status(500).json({ error: 'Server error assigning voter' });
  }
};

// Fetch all booth assignments
export const getBoothAssignments = async (req, res) => {
  try {
    const agents = await pool.query(`
      SELECT u.first_name, u.last_name, b.name AS booth_name
      FROM agent_booths ab
      JOIN users u ON ab.agent_id = u.id
      JOIN booths b ON ab.booth_id = b.id
      ORDER BY b.name
    `);

    const voters = await pool.query(`
      SELECT u.first_name, u.last_name, b.name AS booth_name
      FROM voter_booth_assignments vba
      JOIN users u ON vba.voter_id = u.id
      JOIN booths b ON vba.booth_id = b.id
      ORDER BY b.name
    `);

    res.json({ success: true, agents: agents.rows, voters: voters.rows });
  } catch (err) {
    console.error('Error fetching booth assignments:', err);
    res.status(500).json({ error: 'Server error fetching assignments' });
  }
};
