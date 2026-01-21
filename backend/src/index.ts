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

// ==========================
// CORS CONFIG (PRODUCCIÓN)
// ==========================

const corsOrigin = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN;

const corsOptions: cors.CorsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));

// Manejo explícito de preflight (OPTIONS) — necesario para browsers
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// ==========================
// ROUTES
// ==========================

app.use("/auth", authRoutes);
app.use("/progressions", progressionsRoutes);

// ==========================
// HEALTH CHECK
// ==========================

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({
      status: "ok",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Error en /health:", err);
    res.status(500).json({
      status: "error",
      message: "DB connection failed",
    });
  }
});

// ==========================
// SERVER
// ==========================

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
