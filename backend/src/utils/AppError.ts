// Error controlado: su mensaje es seguro para mostrar al cliente tal cual.
// Cualquier otro error (DB, JWT, etc.) se trata como interno y no se expone.
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
