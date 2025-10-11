import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import agentRoutes from "./routes/agents.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);

app.get("/", (req, res) => res.send("✅ Voting API running"));

io.on("connection", socket => {
  console.log("socket connected:", socket.id);
  socket.on("agent_location_update", payload => {
    io.emit("agent_location_broadcast", payload);
  });
  socket.on("disconnect", () => console.log("socket disconnected:", socket.id));
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`Server up on ${PORT}`));
