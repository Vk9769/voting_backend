import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import agentRoutes from "./routes/agent.js";
import voterRoutes from "./routes/voter.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/voter", voterRoutes);

// Default test route
app.get("/", (req, res) => res.send("✅ Voting API running with Socket.IO and new routes"));

// Socket.IO (for live agent tracking)
io.on("connection", (socket) => {
  console.log("🟢 socket connected:", socket.id);

  socket.on("agent_location_update", (payload) => {
    // Broadcast location updates to all clients
    io.emit("agent_location_broadcast", payload);
  });

  socket.on("disconnect", () => console.log("🔴 socket disconnected:", socket.id));
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => console.log(`🚀 Server up on port ${PORT}`));
