import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/auth.controller";

const router = Router();

// Limita intentos de login/registro por IP para mitigar fuerza bruta / credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

export default router;
