import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  hashPassword,
  comparePassword,
  createAndSendVerification,
  verifyEmailCode,
  generateTotpSecret,
  generateTotpQrCode,
  verifyTotpToken,
  createJwtForUser,
} from '../services/auth.service';
import { validateEmail, validatePassword, validateFullName, validateStudentId } from '../validators';

const router = Router();

// POST /api/auth/register - Student self-registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, studentId } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) { res.status(400).json({ error: emailCheck.error }); return; }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { res.status(400).json({ error: pwCheck.error }); return; }

    const nameCheck = validateFullName(fullName);
    if (!nameCheck.valid) { res.status(400).json({ error: nameCheck.error }); return; }

    const idCheck = validateStudentId(studentId);
    if (!idCheck.valid) { res.status(400).json({ error: idCheck.error }); return; }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const existingSid = await query('SELECT id FROM users WHERE student_id = $1', [studentId]);
    if (existingSid.rows.length > 0) {
      res.status(409).json({ error: 'This student ID is already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified)
       VALUES ($1, $2, $3, 'student', $4, true)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName, studentId]
    );

    const user = result.rows[0];

    const token = createJwtForUser(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isVerified: true },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const result = await query(
      'SELECT id, email, password_hash, full_name, role, is_verified, totp_enabled, totp_secret FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.totp_enabled) {
      const tempToken = createJwtForUser({ id: user.id, email: user.email, role: 'pending_2fa' });
      res.json({ requires2FA: true, tempToken });
      return;
    }

    const token = createJwtForUser(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isVerified: user.is_verified,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/verify-2fa
router.post('/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { tempToken, totpCode } = req.body;

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'dev-secret-change-me') as any;

    const result = await query('SELECT id, email, full_name, role, totp_secret, is_verified FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) { res.status(401).json({ error: 'Invalid session' }); return; }

    const user = result.rows[0];
    const valid = verifyTotpToken(user.totp_secret, totpCode);
    if (!valid) { res.status(401).json({ error: 'Invalid 2FA code' }); return; }

    const token = createJwtForUser(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isVerified: user.is_verified },
    });
  } catch (err: any) {
    console.error('2FA verification error:', err);
    res.status(401).json({ error: 'Invalid or expired session' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.userId;

    const verified = await verifyEmailCode(userId, code);
    if (!verified) {
      res.status(400).json({ error: 'Invalid or expired verification code' });
      return;
    }

    res.json({ message: 'Email verified successfully' });
  } catch (err: any) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await query('SELECT email, is_verified FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    if (result.rows[0].is_verified) { res.json({ message: 'Email already verified' }); return; }

    await createAndSendVerification(userId, result.rows[0].email);
    res.json({ message: 'Verification code resent' });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// POST /api/auth/setup-2fa
router.post('/setup-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    const secret = generateTotpSecret(userResult.rows[0].email);

    await query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret.base32, userId]);

    const qrCode = await generateTotpQrCode(secret.otpauth_url!);
    res.json({ secret: secret.base32, qrCode });
  } catch (err: any) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// POST /api/auth/confirm-2fa
router.post('/confirm-2fa', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { totpCode } = req.body;
    const userId = req.user!.userId;

    const result = await query('SELECT totp_secret FROM users WHERE id = $1', [userId]);
    const valid = verifyTotpToken(result.rows[0].totp_secret, totpCode);

    if (!valid) { res.status(400).json({ error: 'Invalid code. Please try again.' }); return; }

    await query('UPDATE users SET totp_enabled = true WHERE id = $1', [userId]);
    res.json({ message: '2FA enabled successfully' });
  } catch (err: any) {
    console.error('2FA confirm error:', err);
    res.status(500).json({ error: '2FA confirmation failed' });
  }
});

// POST /api/auth/invite-signup - Complete invite-based registration
router.post('/invite-signup', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { res.status(400).json({ error: pwCheck.error }); return; }

    const invResult = await query(
      `SELECT * FROM invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (invResult.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired invitation link' });
      return;
    }

    const invitation = invResult.rows[0];

    const existing = await query('SELECT id FROM users WHERE email = $1', [invitation.email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING id, email, full_name, role`,
      [invitation.email, passwordHash, invitation.full_name, invitation.role]
    );

    await query("UPDATE invitations SET status = 'accepted' WHERE id = $1", [invitation.id]);

    const user = result.rows[0];
    const jwtToken = createJwtForUser(user);

    res.status(201).json({
      token: jwtToken,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isVerified: true },
    });
  } catch (err: any) {
    console.error('Invite signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// GET /api/auth/invite/:token - Fetch invitation details
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await query(
      `SELECT email, full_name, role FROM invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invalid or expired invitation' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Fetch invite error:', err);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, student_id, company_name, phone, is_verified, totp_enabled FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

    const u = result.rows[0];
    res.json({
      id: u.id, email: u.email, fullName: u.full_name, role: u.role,
      studentId: u.student_id, companyName: u.company_name, phone: u.phone,
      isVerified: u.is_verified, totpEnabled: u.totp_enabled,
    });
  } catch (err: any) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
