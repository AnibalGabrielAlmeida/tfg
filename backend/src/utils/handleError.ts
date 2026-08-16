import { Response } from "express";
import { AppError } from "./AppError";

// Si es un AppError, su mensaje es seguro para el cliente.
// Cualquier otro error se loguea completo en servidor y se responde genérico.
export function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}
