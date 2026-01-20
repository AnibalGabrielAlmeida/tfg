import { pool } from "../config/db";

type CreateProgressionDTO = {
  title: string;
  style?: string;
  bpm?: number;
  time_signature?: string;
  key_id?: number | null;
  data: any; // JSONB del front
};

function validateCreatePayload(body: any): CreateProgressionDTO {
  const { title, data, style, bpm, time_signature, key_id } = body ?? {};

  if (!title || typeof title !== "string") {
    throw new Error("title es obligatorio (string)");
  }

  if (data === undefined || data === null) {
    throw new Error("data es obligatorio (JSON)");
  }

  return {
    title,
    data,
    style,
    bpm,
    time_signature,
    key_id: key_id ?? null,
  };
}

export async function createProgressionService(userId: string, body: any) {
  const payload = validateCreatePayload(body);
  console.log("DATA TYPE:", typeof payload.data);

  const result = await pool.query(
  `INSERT INTO progressions (user_id, key_id, title, style, bpm, time_signature, data)
   VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
   RETURNING id, user_id, title, style, bpm, time_signature, key_id, data, created_at`,
  [
    userId,
    payload.key_id,
    payload.title,
    payload.style ?? null,
    payload.bpm ?? null,
    payload.time_signature ?? null,
    JSON.stringify(payload.data) // 👈 clave
  ]
);


  return result.rows[0];
}

export async function listProgressionsService(userId: string) {
  const result = await pool.query(
    `SELECT id, title, style, bpm, time_signature, key_id, created_at, updated_at
     FROM progressions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function getProgressionByIdService(userId: string, id: string) {
  const result = await pool.query(
    `SELECT id, user_id, key_id, title, style, bpm, time_signature, data, created_at, updated_at
     FROM progressions
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rowCount === 0) {
    throw new Error("No encontrada (o no pertenece al usuario)");
  }

  return result.rows[0];
}
