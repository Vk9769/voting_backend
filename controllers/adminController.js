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

// ==================== BOOTH MANAGEMENT (FIXED FOR POSTGIS) ====================

// Create a new booth
export const createBooth = async (req, res) => {
  try {
    const { name, lat, lng, radius_meters, description, address, state, district, ac_name, part_name_no } = req.body;

    if (!name || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Name, lat, and lng are required' });
    }

    const result = await pool.query(
      `INSERT INTO booths 
        (name, latitude, longitude, radius_meters, description, address, state, district, ac_name, part_name_no, created_at)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, name, latitude, longitude, radius_meters, description, address, state, district, ac_name, part_name_no;`,
      [
        name,
        lat,
        lng,
        radius_meters || 50,
        description || null,
        address || null,
        state || null,
        district || null,
        ac_name || null,
        part_name_no || null
      ]
    );

    res.json({ success: true, message: 'Booth created successfully', booth: result.rows[0] });
  } catch (err) {
    console.error('Error creating booth:', err);
    res.status(500).json({ success: false, message: 'Server error creating booth' });
  }
};

// Edit an existing booth
export const editBooth = async (req, res) => {
  try {
    const { booth_id } = req.params;
    const { name, lat, lng, radius_meters, description, address, state, district, ac_name, part_name_no } = req.body;

    if (!booth_id) return res.status(400).json({ success: false, message: 'Booth ID required' });

    const result = await pool.query(
      `UPDATE booths
       SET 
         name = COALESCE($1, name),
         latitude = COALESCE($2, latitude),
         longitude = COALESCE($3, longitude),
         radius_meters = COALESCE($4, radius_meters),
         description = COALESCE($5, description),
         address = COALESCE($6, address),
         state = COALESCE($7, state),
         district = COALESCE($8, district),
         ac_name = COALESCE($9, ac_name),
         part_name_no = COALESCE($10, part_name_no),
         updated_at = NOW()
       WHERE id = $11
       RETURNING id, name, latitude, longitude, radius_meters, description, address, state, district, ac_name, part_name_no;`,
      [name, lat, lng, radius_meters, description, address, state, district, ac_name, part_name_no, booth_id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Booth not found' });

    res.json({ success: true, message: 'Booth updated successfully', booth: result.rows[0] });
  } catch (err) {
    console.error('Error updating booth:', err);
    res.status(500).json({ success: false, message: 'Server error updating booth' });
  }
};

// Fetch all booths
// Fetch all booths in structured format for Flutter app
export const getBooths = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        state,
        district,
        ac_name,
        part_name_no AS part_name,
        COUNT(*) AS booths
      FROM booths
      GROUP BY state, district, ac_name, part_name_no
      ORDER BY state, district, ac_name, part_name_no
    `);

    const boothsData = result.rows.map(row => ({
      state: row.state,
      district: row.district,
      assembly_constituency: row.ac_name,
      part_name: row.part_name,
      booths: parseInt(row.booths, 10)
    }));

    res.json(boothsData);
  } catch (err) {
    console.error('Error fetching booths:', err);
    res.status(500).json({ success: false, message: 'Server error fetching booths' });
  }
};

export const getBoothsFull = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        state,
        district,
        ac_name AS assembly_constituency,
        part_name_no AS part_name,
        radius_meters,
        latitude,
        longitude,
        address
      FROM booths
      ORDER BY state, district, ac_name, part_name_no;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching full booth list:', err);
    res.status(500).json({ error: 'Server error fetching booth list' });
  }
};


// Delete a booth
export const deleteBooth = async (req, res) => {
  try {
    const { booth_id } = req.params;
    if (!booth_id) return res.status(400).json({ success: false, message: 'Booth ID required' });

    const result = await pool.query('DELETE FROM booths WHERE id = $1', [booth_id]);
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Booth not found' });

    res.json({ success: true, message: 'Booth deleted successfully' });
  } catch (err) {
    console.error('Error deleting booth:', err);
    res.status(500).json({ success: false, message: 'Server error deleting booth' });
  }
};

// ==================== FETCH OTHER DATA ====================

// All agents
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
    res.json({ success: true, agents: result.rows });
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ success: false, message: 'Server error fetching agents' });
  }
};

// All reports
export const getReports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
};

// ==================== FLAG ACTIVITY ====================
export const flagActivity = async (req, res) => {
  try {
    const { agent_id, reason } = req.body;
    if (!agent_id || !reason) {
      return res.status(400).json({ success: false, message: 'agent_id and reason are required' });
    }

    await pool.query(
      'INSERT INTO flagged_activities (agent_id, reason, created_at) VALUES ($1, $2, NOW())',
      [agent_id, reason]
    );

    res.json({ success: true, message: 'Activity flagged successfully' });
  } catch (err) {
    console.error('Error flagging activity:', err);
    res.status(500).json({ success: false, message: 'Server error flagging activity' });
  }
};

// ==================== BOOTH ASSIGNMENTS ====================
export const assignAgentToBooth = async (req, res) => {
  const { agent_id, booth_id } = req.body;
  if (!agent_id || !booth_id) {
    return res.status(400).json({ success: false, message: 'agent_id and booth_id are required' });
  }

  try {
    const roleCheck = await pool.query(
      `SELECT r.name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`, [agent_id]
    );

    if (!roleCheck.rows.find(r => r.name === 'agent')) {
      return res.status(400).json({ success: false, message: 'User is not an agent' });
    }

    await pool.query(`
      INSERT INTO agent_booths (agent_id, booth_id)
      VALUES ($1, $2)
      ON CONFLICT (agent_id, booth_id) DO NOTHING
    `, [agent_id, booth_id]);

    res.json({ success: true, message: 'Agent assigned to booth successfully' });
  } catch (err) {
    console.error('Error assigning agent:', err);
    res.status(500).json({ success: false, message: 'Server error assigning agent' });
  }
};

export const assignVoterToBooth = async (req, res) => {
  const { voter_id, booth_id } = req.body;
  if (!voter_id || !booth_id) {
    return res.status(400).json({ success: false, message: 'voter_id and booth_id are required' });
  }

  try {
    const roleCheck = await pool.query(
      `SELECT r.name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`, [voter_id]
    );

    if (!roleCheck.rows.find(r => r.name === 'voter')) {
      return res.status(400).json({ success: false, message: 'User is not a voter' });
    }

    await pool.query(`
      INSERT INTO voter_booth_assignments (voter_id, booth_id)
      VALUES ($1, $2)
      ON CONFLICT (voter_id) DO UPDATE SET booth_id = EXCLUDED.booth_id
    `, [voter_id, booth_id]);

    res.json({ success: true, message: 'Voter assigned to booth successfully' });
  } catch (err) {
    console.error('Error assigning voter:', err);
    res.status(500).json({ success: false, message: 'Server error assigning voter' });
  }
};

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
    res.status(500).json({ success: false, message: 'Server error fetching assignments' });
  }
};
