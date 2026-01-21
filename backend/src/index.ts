import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { pool } from "./config/db";
import authRoutes from "./routes/auth.routes";
import progressionsRoutes from "./routes/progressions.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 🔑 manejar preflight explícitamente
app.options("/*", cors());

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/progressions", progressionsRoutes);

// Endpoint de salud
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({
      status: "ok",
      dbTime: result.rows[0].now
    });
  } catch (err) {
    console.error("Error en /health:", err);
    res.status(500).json({ status: "error", message: "DB connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});

