import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const hashPassword = (plain: string): Promise<string> =>
  argon2.hash(plain, { type: argon2.argon2id });

export const comparePassword = (
  plain: string,
  hash: string
): Promise<boolean> => argon2.verify(hash, plain);

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
  return { accessToken, refreshToken };
};

export const verifyToken = (
  token: string,
  type: 'access' | 'refresh'
): TokenPayload => {
  const secret = type === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret) as TokenPayload;
};
