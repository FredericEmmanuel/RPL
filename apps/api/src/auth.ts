import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@studybuddy/shared";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diatur.");
  }
  return secret;
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): void {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    response.status(401).json({ error: "Silakan masuk untuk melanjutkan." });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string" || typeof payload.userId !== "string") {
      response.status(401).json({ error: "Sesi masuk tidak valid." });
      return;
    }
    request.userId = payload.userId;
    next();
  } catch {
    response.status(401).json({ error: "Sesi masuk kedaluwarsa. Silakan masuk kembali." });
  }
}

export function mapUser(user: {
  id: string;
  name: string;
  email: string;
  schoolOrUniversity: string | null;
  favoriteSubjects: string[];
  preferredLocation: string | null;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    schoolOrUniversity: user.schoolOrUniversity,
    favoriteSubjects: user.favoriteSubjects,
    preferredLocation: user.preferredLocation,
    createdAt: user.createdAt.toISOString()
  };
}
