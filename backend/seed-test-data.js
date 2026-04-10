/**
 * Demo / test data for local development.
 * Run from backend/: npm run db:seed
 */
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { poolOptions } = require('./scripts/pg-pool-options');

dotenv.config({
  path: path.join(__dirname, '.env'),
  override: process.env.NODE_ENV !== 'production',
});

const DEMO_INVITE_TOKEN = '00000000-0000-4000-8000-00000000d001';

async function seed() {
  const pool = new Pool(poolOptions());
  const hash = await bcrypt.hash('Test1234!@#', 12);

  const student = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student@test.com', $1, 'John Student', 'student', '501 000 001', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );

  const coordinator = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
    VALUES ('coordinator@test.com', $1, 'Jane Coordinator', 'coordinator', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );

  const employer = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, company_name, is_verified, is_active)
    VALUES ('employer@test.com', $1, 'Bob Employer', 'employer', 'Tech Corp', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );

  const coordId = coordinator.rows[0].id;
  const employerId = employer.rows[0].id;
  const student1Id = student.rows[0].id;

  console.log('Student:', student.rows[0]);
  console.log('Coordinator:', coordinator.rows[0]);
  console.log('Employer:', employer.rows[0]);

  await pool.query(
    `
    INSERT INTO applications (student_id, status, gpa, program, year_of_study, cover_letter, phone, address, submitted_at)
    VALUES ($1, 'pending', 3.50, 'Computer Science', 3,
      'I am passionate about co-op opportunities and eager to apply my skills in a real-world setting.',
      '(416) 555-0123', '123 University Ave, Toronto, ON', NOW())
    ON CONFLICT (student_id) DO UPDATE SET
      status = 'pending', gpa = 3.50, program = 'Computer Science', submitted_at = COALESCE(applications.submitted_at, NOW())
  `,
    [student1Id]
  );
  console.log('Application: John Student → pending (provisional review queue)');

  const student2 = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student2@test.com', $1, 'Alice Applicant', 'student', '501 000 002', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );

  await pool.query(
    `
    INSERT INTO applications (student_id, status, gpa, program, year_of_study, cover_letter, phone, submitted_at)
    VALUES ($1, 'pending', 3.80, 'Software Engineering', 4,
      'Looking forward to gaining industry experience through the co-op program.', '(647) 555-0456', NOW())
    ON CONFLICT (student_id) DO UPDATE SET
      status = 'pending', gpa = 3.80, program = 'Software Engineering', submitted_at = COALESCE(applications.submitted_at, NOW())
  `,
    [student2.rows[0].id]
  );
  console.log('Application: Alice Applicant → pending');

  const student3 = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student3@test.com', $1, 'Chris Provisional', 'student', '501 000 003', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );

  await pool.query(
    `
    INSERT INTO applications (
      student_id, status, gpa, program, year_of_study, cover_letter, phone, submitted_at,
      provisional_reviewed_by, provisional_reviewed_at
    )
    VALUES ($1, 'provisionally_accepted', 3.65, 'Information Systems', 3,
      'Ready for final review after successful provisional screening.', '(416) 555-0999', NOW() - INTERVAL '3 days',
      $2, NOW() - INTERVAL '2 days')
    ON CONFLICT (student_id) DO UPDATE SET
      status = 'provisionally_accepted',
      gpa = 3.65,
      program = 'Information Systems',
      provisional_reviewed_by = $2,
      provisional_reviewed_at = NOW() - INTERVAL '2 days',
      submitted_at = COALESCE(applications.submitted_at, NOW())
  `,
    [student3.rows[0].id, coordId]
  );
  console.log('Application: Chris Provisional → provisionally_accepted (final review demo)');

  const student4 = await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student4@test.com', $1, 'Dana Placed', 'student', '501 000 004', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true, is_active = true
    RETURNING id, email, role
  `,
    [hash]
  );
  const student4Id = student4.rows[0].id;

  await pool.query(
    `
    INSERT INTO applications (
      student_id, status, gpa, program, year_of_study, cover_letter, phone, submitted_at,
      provisional_reviewed_by, provisional_reviewed_at,
      final_reviewed_by, final_reviewed_at
    )
    VALUES ($1, 'finally_accepted', 3.90, 'Computer Science', 4,
      'Accepted student — use for placement tracker & compliance demos.', '(905) 555-0110', NOW() - INTERVAL '14 days',
      $2, NOW() - INTERVAL '10 days',
      $2, NOW() - INTERVAL '5 days')
    ON CONFLICT (student_id) DO UPDATE SET
      status = 'finally_accepted',
      gpa = 3.90,
      program = 'Computer Science',
      provisional_reviewed_by = $2,
      provisional_reviewed_at = NOW() - INTERVAL '10 days',
      final_reviewed_by = $2,
      final_reviewed_at = NOW() - INTERVAL '5 days',
      submitted_at = COALESCE(applications.submitted_at, NOW())
  `,
    [student4Id, coordId]
  );

  await pool.query(
    `
    INSERT INTO placement_tracker (student_id, status, notes)
    VALUES ($1, 'seeking', 'Demo: awaiting employer match — visible on coordinator tracker.')
    ON CONFLICT (student_id) DO UPDATE SET status = 'seeking', notes = EXCLUDED.notes
  `,
    [student4Id]
  );
  console.log('Application: Dana Placed → finally_accepted + placement tracker (seeking)');

  await pool.query(
    `
    INSERT INTO employer_student_assignments (employer_id, student_id, work_term)
    VALUES ($1, $2, 'Winter 2026')
    ON CONFLICT (employer_id, student_id) DO NOTHING
  `,
    [employerId, student1Id]
  );
  await pool.query(
    `
    INSERT INTO employer_student_assignments (employer_id, student_id, work_term)
    VALUES ($1, $2, 'Winter 2026')
    ON CONFLICT (employer_id, student_id) DO NOTHING
  `,
    [employerId, student4Id]
  );
  console.log('Employer assignments: John Student + Dana Placed → Tech Corp');

  const evalForm = {
    performanceRating: 'Exceeds expectations',
    technicalSkills: 'Strong technical delivery on demo features.',
    communication: 'Clear written and verbal communication.',
    overallComments: 'Seeded evaluation for demo — Dana is performing very well.',
  };
  await pool.query(
    `
    INSERT INTO documents (uploader_id, student_id, document_type, is_online_form, form_data, confirmation_number)
    VALUES ($1, $2, 'employer_evaluation', true, $3::jsonb, 'DEMO-EVAL-SEED-001')
    ON CONFLICT (confirmation_number) DO NOTHING
  `,
    [employerId, student4Id, JSON.stringify(evalForm)]
  );
  console.log('Document: online employer evaluation for Dana (compliance still missing work term report)');

  const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    `
    INSERT INTO invitations (token, email, full_name, role, invited_by, expires_at, status)
    VALUES ($1, 'invite.demo@csa.test', 'Demo Invitee', 'employer', $2, $3, 'pending')
    ON CONFLICT (token) DO NOTHING
  `,
    [DEMO_INVITE_TOKEN, coordId, inviteExpires]
  );
  console.log('Invitation: pending row for invite.demo@csa.test (Invitations page demo)');

  console.log('\n========================================');
  console.log('DEMO / TEST ACCOUNTS');
  console.log('========================================');
  console.log('Student passwords (except admin): Test1234!@#');
  console.log('');
  console.log('Admin:         admin@csa-portal.com     Admin123!@#');
  console.log('Student:       student@test.com         (pending application)');
  console.log('Student 2:     student2@test.com        (pending application)');
  console.log('Student 3:     student3@test.com        (provisionally accepted → final review)');
  console.log('Student 4:     student4@test.com        (accepted + placement seeking + assigned employer)');
  console.log('Coordinator:   coordinator@test.com');
  console.log('Employer:      employer@test.com        (assigned John + Dana)');
  console.log('========================================\n');

  await pool.end();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
