import { Request, Response } from "express";
import {
  createProgressionService,
  listProgressionsService,
  getProgressionByIdService,
} from "../services/progressions.service";
import { handleError } from "../utils/handleError";

export async function createProgression(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;

    const created = await createProgressionService(userId, req.body);
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listProgressions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;

    const rows = await listProgressionsService(userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getProgressionById(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id;

    const row = await getProgressionByIdService(userId, id);
    return res.json(row);
  } catch (error) {
    // getProgressionByIdService lanza AppError(404) si no existe o no pertenece al usuario
    return handleError(res, error);
  }
}
