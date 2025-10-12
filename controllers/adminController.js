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
