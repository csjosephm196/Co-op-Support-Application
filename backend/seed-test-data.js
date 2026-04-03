const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const hash = await bcrypt.hash('Test1234!@#', 12);

  // 1. Create a verified test student
  const student = await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student@test.com', $1, 'John Student', 'student', '501 000 001', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true
    RETURNING id, email, role
  `, [hash]);
  console.log('Student:', student.rows[0]);

  // 2. Create a test coordinator
  const coordinator = await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
    VALUES ('coordinator@test.com', $1, 'Jane Coordinator', 'coordinator', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true
    RETURNING id, email, role
  `, [hash]);
  console.log('Coordinator:', coordinator.rows[0]);

  // 3. Create a test employer
  const employer = await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, company_name, is_verified, is_active)
    VALUES ('employer@test.com', $1, 'Bob Employer', 'employer', 'Tech Corp', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true
    RETURNING id, email, role
  `, [hash]);
  console.log('Employer:', employer.rows[0]);

  // 4. Create a sample submitted application for the student
  const studentId = student.rows[0].id;
  await pool.query(`
    INSERT INTO applications (student_id, status, gpa, program, year_of_study, cover_letter, phone, address, submitted_at)
    VALUES ($1, 'pending', 3.50, 'Computer Science', 3, 'I am passionate about co-op opportunities and eager to apply my skills in a real-world setting.', '(416) 555-0123', '123 University Ave, Toronto, ON', NOW())
    ON CONFLICT (student_id) DO UPDATE SET status = 'pending', gpa = 3.50, program = 'Computer Science', submitted_at = NOW()
  `, [studentId]);
  console.log('Application: created for student (pending)');

  // 5. Create a second test student with a submitted application (for bulk review testing)
  const student2 = await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, student_id, is_verified, is_active)
    VALUES ('student2@test.com', $1, 'Alice Applicant', 'student', '501 000 002', true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_verified = true
    RETURNING id, email, role
  `, [hash]);
  console.log('Student 2:', student2.rows[0]);

  await pool.query(`
    INSERT INTO applications (student_id, status, gpa, program, year_of_study, cover_letter, phone, submitted_at)
    VALUES ($1, 'pending', 3.80, 'Software Engineering', 4, 'Looking forward to gaining industry experience through the co-op program.', '(647) 555-0456', NOW())
    ON CONFLICT (student_id) DO UPDATE SET status = 'pending', gpa = 3.80, program = 'Software Engineering', submitted_at = NOW()
  `, [student2.rows[0].id]);
  console.log('Application: created for student2 (pending)');

  // 6. Assign student to employer
  await pool.query(`
    INSERT INTO employer_student_assignments (employer_id, student_id, work_term)
    VALUES ($1, $2, 'Winter 2026')
    ON CONFLICT (employer_id, student_id) DO NOTHING
  `, [employer.rows[0].id, studentId]);
  console.log('Assignment: student assigned to employer');

  console.log('\n========================================');
  console.log('TEST ACCOUNTS READY');
  console.log('========================================');
  console.log('All passwords: Test1234!@#');
  console.log('');
  console.log('Admin:       admin@csa-portal.com   (role: admin)');
  console.log('             Password: Admin123!@#');
  console.log('Student:     student@test.com       (role: student)');
  console.log('Student 2:   student2@test.com      (role: student)');
  console.log('Coordinator: coordinator@test.com   (role: coordinator)');
  console.log('Employer:    employer@test.com       (role: employer)');
  console.log('========================================\n');

  await pool.end();
}

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
