import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../config/db';
import { generateToken, JwtPayload } from '../middleware/auth';
import { sendEmail, verificationEmail } from '../config/email';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendVerification(userId: string, email: string): Promise<void> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
  await query(
    'INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, code, expiresAt]
  );

  const { subject, html } = verificationEmail(code);
  await sendEmail(email, subject, html);
}

export async function verifyEmailCode(userId: string, code: string): Promise<boolean> {
  const result = await query(
    `SELECT * FROM email_verifications
     WHERE user_id = $1 AND code = $2 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code]
  );

  if (result.rows.length === 0) return false;

  await query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);
  await query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
  return true;
}

export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `CSA Portal (${email})`,
    issuer: 'CSA Portal',
  });
  return secret;
}

export async function generateTotpQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}

export function createJwtForUser(user: { id: string; email: string; role: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return generateToken(payload);
}
