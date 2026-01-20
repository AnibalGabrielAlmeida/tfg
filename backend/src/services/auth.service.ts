import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

interface RegisterDTO {
  email: string;
  password: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterDTO) {
  const { email, password } = data;

  // verificar si el usuario existe
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    throw new Error("El usuario ya existe");
  }

  // hashear contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  // insertar usuario
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [email, passwordHash]
  );

  return result.rows[0];
}

export async function loginUser(data: LoginDTO) {
  const { email, password } = data;

  // buscar usuario
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  // comparar contraseñas
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Credenciales inválidas");
  }

  // generar token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return token;
}
