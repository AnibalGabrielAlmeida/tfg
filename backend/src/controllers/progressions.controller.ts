import { Request, Response } from "express";
import {
  createProgressionService,
  listProgressionsService,
  getProgressionByIdService,
} from "../services/progressions.service";

export async function createProgression(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;

    const created = await createProgressionService(userId, req.body);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function listProgressions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;

    const rows = await listProgressionsService(userId);
    return res.json(rows);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getProgressionById(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id;

    const row = await getProgressionByIdService(userId, id);
    return res.json(row);
  } catch (error: any) {
    // si no existe o no pertenece al usuario
    return res.status(404).json({ error: error.message });
  }
}
