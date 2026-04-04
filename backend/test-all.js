const http = require('http');
require('dotenv').config();

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
const results = [];

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const r = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });

    r.on('error', (e) => resolve({ status: 0, data: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function test(name, ok) {
  if (ok) { passed++; results.push(`  PASS: ${name}`); }
  else { failed++; results.push(`  FAIL: ${name}`); }
}

async function run() {
  console.log('=== CSA End-to-End API Tests ===\n');

  // 1. HEALTH
  console.log('[Health]');
  const health = await req('GET', '/api/health');
  test('Health check returns ok', health.status === 200 && health.data.status === 'ok');

  // 2. AUTH - Login
  console.log('[Auth - Login]');
  const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@csa-portal.com', password: 'Admin123!@#' });
  test('Admin login succeeds', adminLogin.status === 200 && adminLogin.data.token);
  const adminToken = adminLogin.data.token;

  const studentLogin = await req('POST', '/api/auth/login', { email: 'student@test.com', password: 'Test1234!@#' });
  test('Student login succeeds', studentLogin.status === 200 && studentLogin.data.token);
  const studentToken = studentLogin.data.token;

  const coordLogin = await req('POST', '/api/auth/login', { email: 'coordinator@test.com', password: 'Test1234!@#' });
  test('Coordinator login succeeds', coordLogin.status === 200 && coordLogin.data.token);
  const coordToken = coordLogin.data.token;

  const employerLogin = await req('POST', '/api/auth/login', { email: 'employer@test.com', password: 'Test1234!@#' });
  test('Employer login succeeds', employerLogin.status === 200 && employerLogin.data.token);
  const employerToken = employerLogin.data.token;

  const badLogin = await req('POST', '/api/auth/login', { email: 'admin@csa-portal.com', password: 'wrong' });
  test('Bad password rejected', badLogin.status === 401);

  const noUser = await req('POST', '/api/auth/login', { email: 'nobody@test.com', password: 'Test1234!@#' });
  test('Non-existent user rejected', noUser.status === 401);

  // 3. AUTH - Register validation
  console.log('[Auth - Registration Validation]');
  const badName = await req('POST', '/api/auth/register', { email: 'new@test.com', password: 'Test1234!@#', fullName: 'Bob', studentId: '501 999 999' });
  test('Rejects single-word name', badName.status === 400);

  const badEmail = await req('POST', '/api/auth/register', { email: 'bobgmail.com', password: 'Test1234!@#', fullName: 'Bob Smith', studentId: '501 999 999' });
  test('Rejects invalid email (no @)', badEmail.status === 400);

  const shortPass = await req('POST', '/api/auth/register', { email: 'new@test.com', password: 'bo1', fullName: 'Bob Smith', studentId: '501 999 999' });
  test('Rejects short password', shortPass.status === 400);

  const noSpecial = await req('POST', '/api/auth/register', { email: 'new@test.com', password: 'Test12345', fullName: 'Bob Smith', studentId: '501 999 999' });
  test('Rejects password without special char', noSpecial.status === 400);

  const emptyId = await req('POST', '/api/auth/register', { email: 'new@test.com', password: 'Test1234!@#', fullName: 'Bob Smith', studentId: '' });
  test('Rejects empty student ID', emptyId.status === 400);

  const dupEmail = await req('POST', '/api/auth/register', { email: 'student@test.com', password: 'Test1234!@#', fullName: 'Bob Smith', studentId: '501 999 999' });
  test('Rejects duplicate email', dupEmail.status === 409);

  // 4. AUTH - /me
  console.log('[Auth - Profile]');
  const me = await req('GET', '/api/auth/me', null, adminToken);
  test('GET /me returns admin profile', me.status === 200 && me.data.role === 'admin');

  const meStudent = await req('GET', '/api/auth/me', null, studentToken);
  test('GET /me returns student profile', meStudent.status === 200 && meStudent.data.role === 'student');

  const noAuth = await req('GET', '/api/auth/me');
  test('GET /me without token returns 401', noAuth.status === 401);

  // 5. APPLICATIONS - Student
  console.log('[Applications - Student]');
  const myApp = await req('GET', '/api/applications/mine', null, studentToken);
  test('Student can view their application', myApp.status === 200 && myApp.data !== null);
  test('Application status is pending', myApp.data.status === 'pending');
  test('Application GPA is 3.50', parseFloat(myApp.data.gpa) === 3.5);

  // 6. APPLICATIONS - Coordinator listing
  console.log('[Applications - Coordinator]');
  const allApps = await req('GET', '/api/applications?status=pending', null, coordToken);
  test('Coordinator can list pending applications', allApps.status === 200 && Array.isArray(allApps.data));
  test('Pending applications exist', allApps.data.length >= 2);

  const appDetail = await req('GET', `/api/applications/${myApp.data.id}`, null, coordToken);
  test('Coordinator can view application detail', appDetail.status === 200 && appDetail.data.student_name === 'John Student');

  // Student should NOT access coordinator routes
  const studentForbidden = await req('GET', '/api/applications?status=pending', null, studentToken);
  test('Student cannot list all applications (403)', studentForbidden.status === 403);

  // 7. COORDINATOR - Provisional Review
  console.log('[Coordinator - Provisional Review]');
  const provAccept = await req('POST', '/api/coordinator/review/provisional', { applicationId: myApp.data.id, decision: 'provisionally_accepted' }, coordToken);
  test('Provisional accept works', provAccept.status === 200);

  // Get student2's application for more tests
  const allApps2 = await req('GET', '/api/applications?status=pending', null, coordToken);
  let student2AppId = null;
  if (allApps2.data && allApps2.data.length > 0) {
    student2AppId = allApps2.data[0].id;
    const provAccept2 = await req('POST', '/api/coordinator/review/provisional', { applicationId: student2AppId, decision: 'provisionally_rejected' }, coordToken);
    test('Provisional reject works', provAccept2.status === 200);
  } else {
    test('Provisional reject works (no app to test)', false);
  }

  // 8. COORDINATOR - Final Review
  console.log('[Coordinator - Final Review]');
  const finalAccept = await req('POST', '/api/coordinator/review/final', { applicationId: myApp.data.id, decision: 'finally_accepted' }, coordToken);
  test('Final accept works', finalAccept.status === 200);

  if (student2AppId) {
    const finalReject = await req('POST', '/api/coordinator/review/final', { applicationId: student2AppId, decision: 'finally_rejected' }, coordToken);
    test('Final reject works', finalReject.status === 200);
  }

  // Verify application status changed
  const updatedApp = await req('GET', '/api/applications/mine', null, studentToken);
  test('Student app status is now finally_accepted', updatedApp.data.status === 'finally_accepted');

  // 9. COORDINATOR - Compliance
  console.log('[Coordinator - Compliance]');
  const compliance = await req('GET', '/api/coordinator/compliance', null, coordToken);
  test('Compliance report loads', compliance.status === 200 && compliance.data.totalStudents !== undefined);
  test('Compliance shows finally_accepted count', compliance.data.applications.finally_accepted >= 1);

  // 10. COORDINATOR - Missing Submissions
  const missing = await req('GET', '/api/coordinator/missing-submissions', null, coordToken);
  test('Missing submissions loads', missing.status === 200 && Array.isArray(missing.data));

  // 11. COORDINATOR - Send Reminders
  const reminders = await req('POST', '/api/coordinator/send-reminders', {}, coordToken);
  test('Send reminders endpoint works', reminders.status === 200);

  // 12. COORDINATOR - Tracker
  console.log('[Coordinator - Tracker]');
  const tracker = await req('GET', '/api/coordinator/tracker', null, coordToken);
  test('Tracker loads', tracker.status === 200 && Array.isArray(tracker.data));
  test('Accepted student appears in tracker', tracker.data.length >= 1);

  if (tracker.data.length > 0) {
    const sid = tracker.data[0].student_id;
    const updateTracker = await req('PUT', `/api/coordinator/tracker/${sid}`, { status: 'placed', notes: 'Placed at Tech Corp' }, coordToken);
    test('Tracker update works', updateTracker.status === 200);
  }

  // 13. COORDINATOR - Invitations
  console.log('[Coordinator - Invitations]');
  const sendInvite = await req('POST', '/api/invitations', { email: 'newemployer@company.com', fullName: 'New Employer', role: 'employer' }, coordToken);
  test('Send employer invitation works', sendInvite.status === 201);

  const listInvites = await req('GET', '/api/invitations', null, coordToken);
  test('List invitations works', listInvites.status === 200 && Array.isArray(listInvites.data));

  // Coordinator can only invite employers, not coordinators
  const badInvite = await req('POST', '/api/invitations', { email: 'newcoord@test.com', fullName: 'New Coord', role: 'coordinator' }, coordToken);
  test('Coordinator cannot invite other coordinators (403)', badInvite.status === 403);

  // Admin CAN invite coordinators
  const adminInvite = await req('POST', '/api/invitations', { email: 'newcoord@test.com', fullName: 'New Coord', role: 'coordinator' }, adminToken);
  test('Admin can invite coordinators', adminInvite.status === 201);

  // 14. EMPLOYER - Students
  console.log('[Employer Portal]');
  const myStudents = await req('GET', '/api/employer/students', null, employerToken);
  test('Employer can view assigned students', myStudents.status === 200 && Array.isArray(myStudents.data));
  test('Employer has 1 assigned student', myStudents.data.length === 1);

  // 15. EMPLOYER - Online Form Evaluation
  const evalForm = await req('POST', '/api/documents/employer-form', {
    studentId: myStudents.data[0]?.student_id,
    formData: {
      performanceRating: 'Excellent',
      technicalSkills: 'Good',
      communication: 'Excellent',
      teamwork: 'Good',
      overallComments: 'Outstanding co-op student with great technical skills.',
    },
  }, employerToken);
  test('Employer online form submission works', evalForm.status === 201 && evalForm.data.confirmationNumber);

  // Validate missing form fields
  const badForm = await req('POST', '/api/documents/employer-form', {
    studentId: myStudents.data[0]?.student_id,
    formData: { performanceRating: 'Good' },
  }, employerToken);
  test('Employer form rejects missing required fields', badForm.status === 400);

  // Blank form data
  const emptyForm = await req('POST', '/api/documents/employer-form', {
    studentId: myStudents.data[0]?.student_id,
    formData: {},
  }, employerToken);
  test('Employer form rejects empty form', emptyForm.status === 400);

  // 16. EMPLOYER - Evaluations list
  const evals = await req('GET', '/api/employer/evaluations', null, employerToken);
  test('Employer can list submitted evaluations', evals.status === 200 && evals.data.length >= 1);

  // 17. DOCUMENTS - Student
  console.log('[Documents - Student]');
  const myDocs = await req('GET', '/api/documents/mine', null, studentToken);
  test('Student can list their documents', myDocs.status === 200 && Array.isArray(myDocs.data));

  // 18. DOCUMENTS - Coordinator
  const allDocs = await req('GET', '/api/documents/all', null, coordToken);
  test('Coordinator can list all documents', allDocs.status === 200 && Array.isArray(allDocs.data));

  // 19. GPA Validation
  console.log('[Validation - GPA]');
  const student2Login = await req('POST', '/api/auth/login', { email: 'student2@test.com', password: 'Test1234!@#' });
  const s2Token = student2Login.data.token;

  // Reset student2's application to draft for testing
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DELETE FROM applications WHERE student_id = (SELECT id FROM users WHERE email = 'student2@test.com')");

  const lowGpa = await req('POST', '/api/applications/submit', { gpa: '2.5', program: 'Math', yearOfStudy: '2', coverLetter: '', additionalInfo: '', phone: '', address: '' }, s2Token);
  test('GPA below 3.0 is rejected', lowGpa.status === 400 && lowGpa.data.error.includes('3.0'));

  const goodGpa = await req('POST', '/api/applications/submit', { gpa: '3.2', program: 'Math', yearOfStudy: '2', coverLetter: '', additionalInfo: '', phone: '', address: '' }, s2Token);
  test('GPA 3.2 is accepted', goodGpa.status === 200);

  await pool.end();

  // 20. AUTOSAVE
  console.log('[Applications - Autosave]');
  // Clean up previous test user if exists
  const { Pool: P0 } = require('pg');
  const p0 = new P0({ connectionString: process.env.DATABASE_URL });
  await p0.query("DELETE FROM applications WHERE student_id = (SELECT id FROM users WHERE email = 'fresh@test.com')");
  await p0.query("DELETE FROM email_verifications WHERE user_id = (SELECT id FROM users WHERE email = 'fresh@test.com')");
  await p0.query("DELETE FROM users WHERE email = 'fresh@test.com'");
  await p0.end();

  // Register a fresh student for autosave test
  const freshReg = await req('POST', '/api/auth/register', { email: 'fresh@test.com', password: 'Test1234!@#', fullName: 'Fresh Student', studentId: '501 999 888' });
  if (freshReg.data.token) {
    // Mark as verified directly
    const { Pool: P2 } = require('pg');
    const p2 = new P2({ connectionString: process.env.DATABASE_URL });
    await p2.query("UPDATE users SET is_verified = true WHERE email = 'fresh@test.com'");
    await p2.end();

    const freshToken = freshReg.data.token;
    const save = await req('POST', '/api/applications/autosave', { gpa: '3.5', program: 'Physics', yearOfStudy: '2' }, freshToken);
    test('Autosave works', save.status === 200);

    const restored = await req('GET', '/api/applications/mine', null, freshToken);
    test('Autosaved data is restored', restored.data && restored.data.program === 'Physics');
  } else {
    test('Autosave works', false);
    test('Autosaved data is restored', false);
  }

  // 21. DEADLINES
  console.log('[Deadlines]');
  const getDeadlines = await req('GET', '/api/documents/deadlines', null, studentToken);
  test('GET deadlines returns array', getDeadlines.status === 200 && Array.isArray(getDeadlines.data));
  test('Default deadline exists', getDeadlines.data.length >= 1);

  const setDeadline = await req('POST', '/api/documents/deadlines', {
    documentType: 'work_term_report', workTerm: 'Summer 2026', dueDate: '2026-08-31T23:59:59Z'
  }, coordToken);
  test('Coordinator can set deadline', setDeadline.status === 200);

  const studentCantSet = await req('POST', '/api/documents/deadlines', {
    documentType: 'work_term_report', workTerm: 'Fall 2026', dueDate: '2026-12-31T23:59:59Z'
  }, studentToken);
  test('Student cannot set deadline (403)', studentCantSet.status === 403);

  // 22. TEMPLATE
  console.log('[Template]');
  const tmpl = await req('GET', '/api/documents/template', null, studentToken);
  test('Student can generate template', tmpl.status === 200 && tmpl.data.title === 'Work Term Report');
  test('Template has sections', Array.isArray(tmpl.data.sections) && tmpl.data.sections.length >= 5);
  test('Template has student info', tmpl.data.student && tmpl.data.student.name === 'John Student');

  const employerCantTemplate = await req('GET', '/api/documents/template', null, employerToken);
  test('Employer cannot access template (403)', employerCantTemplate.status === 403);

  // SUMMARY
  console.log('\n========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  results.forEach((r) => console.log(r));
  console.log('----------------------------------------');
  console.log(`  TOTAL: ${passed + failed}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Test runner error:', e); process.exit(1); });
