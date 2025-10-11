import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const demoUser = { id: 1, username: "admin", password: "admin123" };

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== demoUser.username || password !== demoUser.password)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: demoUser.id, username }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

export default router;
