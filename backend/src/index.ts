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
// CORS CONFIG (FINAL - PRODUCCIÓN)
// ==========================

// Render actualmente tiene FRONTEND_URL (según tu captura).
// Dejamos fallback por compatibilidad si después lo renombrás.
const expectedOrigin = (
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_ORIGIN ||
  process.env.CORS_ORIGIN ||
  ""
).trim();

const corsOptions: cors.CorsOptions = {
  // Usamos función para evitar problemas por string undefined o espacios
  origin: (origin, cb) => {
    // Permitir requests sin origin (Postman/curl/healthchecks)
    if (!origin) return cb(null, true);

    // Permitir SOLO el frontend esperado
    if (origin === expectedOrigin) return cb(null, true);

    // Si no coincide, se bloquea
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));

// Manejo explícito de preflight (OPTIONS) — necesario para browsers
// (Regex porque tu stack rompe con "*" y "/*")
app.options(/.*/, cors(corsOptions));

// ==========================
// DEBUG
// ==========================
// console.log("CORS expectedOrigin (env):", JSON.stringify(expectedOrigin));
//
// app.use((req, _res, next) => {
//   if (req.method === "OPTIONS") {
//     console.log("PRE-FLIGHT:", req.method, req.path, "Origin:", req.headers.origin);
//   }
//   next();
// });
//
// Si ves "expectedOrigin" vacío o distinto al Netlify real, el problema está en Render env vars.
// Si ves Origin distinto al esperado, el problema está en la URL real que usa el navegador.

// ==========================
// MIDDLEWARE
// ==========================

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
