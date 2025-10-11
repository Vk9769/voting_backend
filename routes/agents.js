import express from "express";
import pool from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const q = `SELECT id, name, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat, created_at FROM agents ORDER BY id DESC`;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, lat, lng } = req.body;
    const q = `INSERT INTO agents (name, location) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3),4326)::geography) RETURNING id, name, created_at`;
    const { rows } = await pool.query(q, [name, lng, lat]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
