import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateGpa } from '../validators';

const router = Router();

// GET /api/applications/mine - Get student's own application
router.get('/mine', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM applications WHERE student_id = $1`,
      [req.user!.userId]
    );
    res.json(result.rows[0] || null);
  } catch (err: any) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications/autosave - Autosave application draft
router.post('/autosave', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address } = req.body;

    const existing = await query('SELECT id, status FROM applications WHERE student_id = $1', [userId]);

    if (existing.rows.length > 0 && existing.rows[0].status !== 'draft') {
      res.status(400).json({ error: 'Application already submitted' });
      return;
    }

    const autosaveData = { gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address };

    if (existing.rows.length > 0) {
      await query(
        `UPDATE applications SET autosave_data = $1, gpa = $2, program = $3, year_of_study = $4,
         cover_letter = $5, additional_info = $6, phone = $7, address = $8, updated_at = NOW()
         WHERE student_id = $9`,
        [JSON.stringify(autosaveData), gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address, userId]
      );
    } else {
      await query(
        `INSERT INTO applications (student_id, status, autosave_data, gpa, program, year_of_study, cover_letter, additional_info, phone, address)
         VALUES ($1, 'draft', $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, JSON.stringify(autosaveData), gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address]
      );
    }

    res.json({ message: 'Progress saved' });
  } catch (err: any) {
    console.error('Autosave error:', err);
    res.status(500).json({ error: 'Autosave failed' });
  }
});

// POST /api/applications/submit - Submit application
router.post('/submit', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address } = req.body;

    const gpaCheck = validateGpa(parseFloat(gpa));
    if (!gpaCheck.valid) { res.status(400).json({ error: gpaCheck.error }); return; }

    if (!program || !yearOfStudy) {
      res.status(400).json({ error: 'Program and year of study are required' });
      return;
    }

    const existing = await query('SELECT id, status FROM applications WHERE student_id = $1', [userId]);

    if (existing.rows.length > 0 && existing.rows[0].status !== 'draft') {
      res.status(400).json({ error: 'Application already submitted' });
      return;
    }

    if (existing.rows.length > 0) {
      await query(
        `UPDATE applications SET status = 'pending', gpa = $1, program = $2, year_of_study = $3,
         cover_letter = $4, additional_info = $5, phone = $6, address = $7,
         submitted_at = NOW(), updated_at = NOW()
         WHERE student_id = $8`,
        [gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address, userId]
      );
    } else {
      await query(
        `INSERT INTO applications (student_id, status, gpa, program, year_of_study, cover_letter, additional_info, phone, address, submitted_at)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [userId, gpa, program, yearOfStudy, coverLetter, additionalInfo, phone, address]
      );
    }

    res.json({ message: 'Application submitted successfully' });
  } catch (err: any) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// GET /api/applications - List all applications (coordinator)
router.get('/', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT a.*, u.full_name as student_name, u.email as student_email, u.student_id as student_number
      FROM applications a
      JOIN users u ON u.id = a.student_id
    `;
    const params: any[] = [];

    if (status) {
      sql += ' WHERE a.status = $1';
      params.push(status);
    }

    sql += ' ORDER BY a.submitted_at DESC NULLS LAST';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('List applications error:', err);
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

// GET /api/applications/:id - Get application detail
router.get('/:id', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT a.*, u.full_name as student_name, u.email as student_email, u.student_id as student_number
       FROM applications a
       JOIN users u ON u.id = a.student_id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

export default router;
