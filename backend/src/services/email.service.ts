import { query } from '../config/db';
import { sendEmail, reminderEmail } from '../config/email';

export async function sendOverdueReminders(): Promise<{ sent: number; errors: number }> {
  const result = await query(`
    SELECT u.id, u.email, u.full_name
    FROM users u
    INNER JOIN applications a ON a.student_id = u.id
    WHERE a.status = 'finally_accepted'
      AND u.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.student_id = u.id
          AND d.document_type = 'work_term_report'
      )
  `);

  let sent = 0;
  let errors = 0;

  for (const student of result.rows) {
    const { subject, html } = reminderEmail(student.full_name, 'Work Term Report');
    const success = await sendEmail(student.email, subject, html);
    if (success) sent++;
    else errors++;
  }

  return { sent, errors };
}

export async function getComplianceStats() {
  const totalStudents = await query(`
    SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_verified = true
  `);

  const applicationStats = await query(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `);

  const reportStats = await query(`
    SELECT
      COUNT(DISTINCT a.student_id) FILTER (WHERE d.id IS NOT NULL) as with_report,
      COUNT(DISTINCT a.student_id) FILTER (WHERE d.id IS NULL) as without_report
    FROM applications a
    LEFT JOIN documents d ON d.student_id = a.student_id AND d.document_type = 'work_term_report'
    WHERE a.status = 'finally_accepted'
  `);

  const evalStats = await query(`
    SELECT
      COUNT(DISTINCT a.student_id) FILTER (WHERE d.id IS NOT NULL) as with_evaluation,
      COUNT(DISTINCT a.student_id) FILTER (WHERE d.id IS NULL) as without_evaluation
    FROM applications a
    LEFT JOIN documents d ON d.student_id = a.student_id AND d.document_type = 'employer_evaluation'
    WHERE a.status = 'finally_accepted'
  `);

  const placementStats = await query(`
    SELECT status, COUNT(*) as count FROM placement_tracker GROUP BY status
  `);

  return {
    totalStudents: parseInt(totalStudents.rows[0]?.count || '0'),
    applications: applicationStats.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {}),
    reports: reportStats.rows[0] || { with_report: 0, without_report: 0 },
    evaluations: evalStats.rows[0] || { with_evaluation: 0, without_evaluation: 0 },
    placements: placementStats.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {}),
  };
}
