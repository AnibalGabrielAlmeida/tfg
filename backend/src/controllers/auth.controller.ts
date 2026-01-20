import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const token = await loginUser(req.body);
    return res.json({ token });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
