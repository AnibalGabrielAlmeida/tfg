import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  createProgression,
  listProgressions,
  getProgressionById,
} from "../controllers/progressions.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createProgression);
router.get("/", listProgressions);
router.get("/:id", getProgressionById);

export default router;
