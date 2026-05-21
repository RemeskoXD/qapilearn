import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface JwtPayload {
  uid: string;
  role: string;
  email: string;
}

const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 dní

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = 'qhub_token';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none' as const,
  secure: true,
  maxAge: TOKEN_TTL_SEC * 1000,
  path: '/',
};
