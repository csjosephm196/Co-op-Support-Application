import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendEmail, applicationDecisionEmail } from '../config/email';
import { getComplianceStats, sendOverdueReminders } from '../services/email.service';

const router = Router();

// POST /api/coordinator/review/provisional - Provisional accept/reject
router.post('/review/provisional', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, decision } = req.body;

    if (!['provisionally_accepted', 'provisionally_rejected'].includes(decision)) {
      res.status(400).json({ error: 'Decision must be provisionally_accepted or provisionally_rejected' });
      return;
    }

    const app = await query('SELECT id, status FROM applications WHERE id = $1', [applicationId]);
    if (app.rows.length === 0) { res.status(404).json({ error: 'Application not found' }); return; }
    if (app.rows[0].status !== 'pending') {
      res.status(400).json({ error: 'Application is not in pending status' });
      return;
    }

    await query(
      `UPDATE applications SET status = $1, provisional_reviewed_by = $2, provisional_reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [decision, req.user!.userId, applicationId]
    );

    res.json({ message: 'Provisional review saved' });
  } catch (err: any) {
    console.error('Provisional review error:', err);
    res.status(500).json({ error: 'Review failed' });
  }
});

// POST /api/coordinator/review/final - Final accept/reject
router.post('/review/final', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, decision } = req.body;

    if (!['finally_accepted', 'finally_rejected'].includes(decision)) {
      res.status(400).json({ error: 'Decision must be finally_accepted or finally_rejected' });
      return;
    }

    const app = await query(
      `SELECT a.id, a.status, a.student_id, u.email, u.full_name
       FROM applications a JOIN users u ON u.id = a.student_id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (app.rows.length === 0) { res.status(404).json({ error: 'Application not found' }); return; }
    if (!['provisionally_accepted', 'provisionally_rejected'].includes(app.rows[0].status)) {
      res.status(400).json({ error: 'Application must be in provisional status for final review' });
      return;
    }

    await query(
      `UPDATE applications SET status = $1, final_reviewed_by = $2, final_reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [decision, req.user!.userId, applicationId]
    );

    // Add to placement tracker if accepted
    if (decision === 'finally_accepted') {
      await query(
        `INSERT INTO placement_tracker (student_id, status) VALUES ($1, 'seeking')
         ON CONFLICT (student_id) DO NOTHING`,
        [app.rows[0].student_id]
      );
    }

    const { subject, html } = applicationDecisionEmail(app.rows[0].full_name, decision);
    await sendEmail(app.rows[0].email, subject, html);

    res.json({ message: 'Final review saved and student notified' });
  } catch (err: any) {
    console.error('Final review error:', err);
    res.status(500).json({ error: 'Review failed' });
  }
});

// POST /api/coordinator/review/bulk-final - Bulk final review
router.post('/review/bulk-final', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationIds, decision } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      res.status(400).json({ error: 'No applications selected' });
      return;
    }

    if (!['finally_accepted', 'finally_rejected'].includes(decision)) {
      res.status(400).json({ error: 'Invalid decision' });
      return;
    }

    const apps = await query(
      `SELECT a.id, a.status, a.student_id, u.email, u.full_name
       FROM applications a JOIN users u ON u.id = a.student_id
       WHERE a.id = ANY($1) AND a.status IN ('provisionally_accepted', 'provisionally_rejected')`,
      [applicationIds]
    );

    let processed = 0;
    for (const app of apps.rows) {
      await query(
        `UPDATE applications SET status = $1, final_reviewed_by = $2, final_reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [decision, req.user!.userId, app.id]
      );

      if (decision === 'finally_accepted') {
        await query(
          `INSERT INTO placement_tracker (student_id, status) VALUES ($1, 'seeking')
           ON CONFLICT (student_id) DO NOTHING`,
          [app.student_id]
        );
      }

      const { subject, html } = applicationDecisionEmail(app.full_name, decision);
      await sendEmail(app.email, subject, html);
      processed++;
    }

    res.json({ message: `${processed} application(s) processed` });
  } catch (err: any) {
    console.error('Bulk final review error:', err);
    res.status(500).json({ error: 'Bulk review failed' });
  }
});

// GET /api/coordinator/compliance - Compliance report
router.get('/compliance', authenticate, authorize('coordinator', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getComplianceStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Compliance report error:', err);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// GET /api/coordinator/missing-submissions - Students missing reports/evaluations
router.get('/missing-submissions', authenticate, authorize('coordinator', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT u.id, u.full_name, u.email, u.student_id,
        CASE WHEN wr.id IS NOT NULL THEN true ELSE false END as has_work_report,
        CASE WHEN ee.id IS NOT NULL THEN true ELSE false END as has_evaluation
      FROM users u
      INNER JOIN applications a ON a.student_id = u.id AND a.status = 'finally_accepted'
      LEFT JOIN documents wr ON wr.student_id = u.id AND wr.document_type = 'work_term_report'
      LEFT JOIN documents ee ON ee.student_id = u.id AND ee.document_type = 'employer_evaluation'
      WHERE wr.id IS NULL OR ee.id IS NULL
      ORDER BY u.full_name
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Missing submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch missing submissions' });
  }
});

// POST /api/coordinator/send-reminders - Send overdue report reminders
router.post('/send-reminders', authenticate, authorize('coordinator', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await sendOverdueReminders();
    res.json({ message: `Sent ${result.sent} reminder(s), ${result.errors} error(s)` });
  } catch (err: any) {
    console.error('Send reminders error:', err);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// Placement tracker routes
router.get('/tracker', authenticate, authorize('coordinator', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT pt.*, u.full_name, u.email, u.student_id as student_number
      FROM placement_tracker pt
      JOIN users u ON u.id = pt.student_id
      ORDER BY pt.added_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Tracker error:', err);
    res.status(500).json({ error: 'Failed to fetch tracker' });
  }
});

router.put('/tracker/:studentId', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    await query(
      'UPDATE placement_tracker SET status = $1, notes = $2, updated_at = NOW() WHERE student_id = $3',
      [status, notes, req.params.studentId]
    );
    res.json({ message: 'Tracker updated' });
  } catch (err: any) {
    console.error('Tracker update error:', err);
    res.status(500).json({ error: 'Failed to update tracker' });
  }
});

// Employer-student assignment management
router.post('/assign-student', authenticate, authorize('coordinator', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { employerId, studentId, workTerm } = req.body;
    await query(
      `INSERT INTO employer_student_assignments (employer_id, student_id, work_term)
       VALUES ($1, $2, $3) ON CONFLICT (employer_id, student_id) DO UPDATE SET work_term = $3`,
      [employerId, studentId, workTerm]
    );
    res.json({ message: 'Student assigned to employer' });
  } catch (err: any) {
    console.error('Assign student error:', err);
    res.status(500).json({ error: 'Assignment failed' });
  }
});

export default router;
