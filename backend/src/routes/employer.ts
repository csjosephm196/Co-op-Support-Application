import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/employer/students - Get students assigned to this employer
router.get('/students', authenticate, authorize('employer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT esa.id as assignment_id, esa.work_term,
              u.id as student_id, u.full_name, u.email, u.student_id as student_number
       FROM employer_student_assignments esa
       JOIN users u ON u.id = esa.student_id
       WHERE esa.employer_id = $1
       ORDER BY u.full_name`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Get assigned students error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned students' });
  }
});

// GET /api/employer/evaluations - Get evaluations submitted by this employer
router.get('/evaluations', authenticate, authorize('employer'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT d.id, d.student_id, d.file_name, d.is_online_form, d.confirmation_number, d.uploaded_at,
              u.full_name as student_name
       FROM documents d
       JOIN users u ON u.id = d.student_id
       WHERE d.uploader_id = $1 AND d.document_type = 'employer_evaluation'
       ORDER BY d.uploaded_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Get evaluations error:', err);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

export default router;
