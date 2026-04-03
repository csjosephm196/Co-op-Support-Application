import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendEmail, invitationEmail } from '../config/email';
import { validateEmail, validateFullName } from '../validators';

const router = Router();

// POST /api/invitations - Send an onboarding invitation
router.post('/', authenticate, authorize('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, role } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) { res.status(400).json({ error: emailCheck.error }); return; }

    const nameCheck = validateFullName(fullName);
    if (!nameCheck.valid) { res.status(400).json({ error: nameCheck.error }); return; }

    if (!['coordinator', 'employer'].includes(role)) {
      res.status(400).json({ error: 'Can only invite coordinators or employers' });
      return;
    }

    // Permission matrix
    const userRole = req.user!.role;
    if (userRole === 'coordinator' && role !== 'employer') {
      res.status(403).json({ error: 'Coordinators can only invite employers' });
      return;
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO invitations (token, email, full_name, role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [token, email, fullName, role, req.user!.userId, expiresAt]
    );

    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${token}`;
    const { subject, html } = invitationEmail(fullName, role, link);
    await sendEmail(email, subject, html);

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (err: any) {
    console.error('Send invitation error:', err);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// GET /api/invitations - List invitations (admin/coordinator)
router.get('/', authenticate, authorize('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT i.id, i.email, i.full_name, i.role, i.status, i.created_at, i.expires_at,
              u.full_name as invited_by_name
       FROM invitations i
       LEFT JOIN users u ON u.id = i.invited_by
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('List invitations error:', err);
    res.status(500).json({ error: 'Failed to list invitations' });
  }
});

export default router;
