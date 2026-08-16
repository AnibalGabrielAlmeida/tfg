import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { AppError } from "../utils/AppError";

interface RegisterDTO {
  email: string;
  password: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function registerUser(data: RegisterDTO) {
  const { email, password } = data ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("Email inválido", 400);
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
  }

  // verificar si el usuario existe
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    throw new AppError("El usuario ya existe", 409);
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
  const { email, password } = data ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError("Email y contraseña son obligatorios", 400);
  }

  // buscar usuario
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  // comparar contraseñas
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  // generar token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return token;
}
