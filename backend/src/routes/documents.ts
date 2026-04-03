import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { uploadPdf } from '../middleware/upload';

const router = Router();

function generateConfirmationNumber(): string {
  return `CSA-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

// POST /api/documents/upload - Upload a PDF document (student: work term report)
router.post(
  '/upload',
  authenticate,
  authorize('student'),
  uploadPdf.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'PDF file is required' });
        return;
      }

      const documentType = req.body.documentType || 'work_term_report';
      if (documentType !== 'work_term_report') {
        res.status(400).json({ error: 'Students can only upload work term reports' });
        return;
      }

      const confirmationNumber = generateConfirmationNumber();
      await query(
        `INSERT INTO documents (uploader_id, student_id, document_type, file_path, file_name, file_size, confirmation_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user!.userId, req.user!.userId, documentType,
          req.file.path, req.file.originalname, req.file.size,
          confirmationNumber,
        ]
      );

      res.status(201).json({ message: 'Document uploaded successfully', confirmationNumber });
    } catch (err: any) {
      console.error('Document upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// POST /api/documents/employer-upload - Employer uploads evaluation PDF
router.post(
  '/employer-upload',
  authenticate,
  authorize('employer'),
  uploadPdf.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'PDF file is required' });
        return;
      }

      const { studentId } = req.body;
      if (!studentId) {
        res.status(400).json({ error: 'Student selection is required' });
        return;
      }

      const assignment = await query(
        'SELECT id FROM employer_student_assignments WHERE employer_id = $1 AND student_id = $2',
        [req.user!.userId, studentId]
      );

      if (assignment.rows.length === 0) {
        res.status(403).json({ error: 'You are not assigned to this student' });
        return;
      }

      const confirmationNumber = generateConfirmationNumber();
      await query(
        `INSERT INTO documents (uploader_id, student_id, document_type, file_path, file_name, file_size, confirmation_number)
         VALUES ($1, $2, 'employer_evaluation', $3, $4, $5, $6)`,
        [req.user!.userId, studentId, req.file.path, req.file.originalname, req.file.size, confirmationNumber]
      );

      res.status(201).json({ message: 'Evaluation uploaded successfully', confirmationNumber });
    } catch (err: any) {
      console.error('Employer upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// POST /api/documents/employer-form - Employer submits evaluation via online form
router.post('/employer-form', authenticate, authorize('employer'), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, formData } = req.body;

    if (!studentId) {
      res.status(400).json({ error: 'Student selection is required' });
      return;
    }

    if (!formData || Object.keys(formData).length === 0) {
      res.status(400).json({ error: 'Form data is required' });
      return;
    }

    const requiredFields = ['performanceRating', 'technicalSkills', 'communication', 'overallComments'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        res.status(400).json({ error: `Missing required field: ${field}` });
        return;
      }
    }

    const assignment = await query(
      'SELECT id FROM employer_student_assignments WHERE employer_id = $1 AND student_id = $2',
      [req.user!.userId, studentId]
    );

    if (assignment.rows.length === 0) {
      res.status(403).json({ error: 'You are not assigned to this student' });
      return;
    }

    const confirmationNumber = generateConfirmationNumber();
    await query(
      `INSERT INTO documents (uploader_id, student_id, document_type, is_online_form, form_data, confirmation_number)
       VALUES ($1, $2, 'employer_evaluation', true, $3, $4)`,
      [req.user!.userId, studentId, JSON.stringify(formData), confirmationNumber]
    );

    res.status(201).json({ message: 'Evaluation form submitted', confirmationNumber });
  } catch (err: any) {
    console.error('Employer form error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// GET /api/documents/mine - Student's own documents
router.get('/mine', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, document_type, file_name, file_size, confirmation_number, uploaded_at
       FROM documents WHERE student_id = $1 ORDER BY uploaded_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/all - All documents (coordinator)
router.get('/all', authenticate, authorize('coordinator', 'admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT d.*, u.full_name as student_name, u.student_id as student_number,
             up.full_name as uploader_name
      FROM documents d
      JOIN users u ON u.id = d.student_id
      JOIN users up ON up.id = d.uploader_id
      ORDER BY d.uploaded_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Get all documents error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
