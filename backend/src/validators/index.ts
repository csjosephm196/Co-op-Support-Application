export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Name is required' };
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { valid: false, error: 'Please enter your full name (first and last)' };
  }
  return { valid: true };
}

export function validateStudentId(studentId: string): { valid: boolean; error?: string } {
  if (!studentId || studentId.trim().length === 0) {
    return { valid: false, error: 'Student ID cannot be empty' };
  }
  return { valid: true };
}

export function validateGpa(gpa: number): { valid: boolean; error?: string } {
  if (gpa === null || gpa === undefined || isNaN(gpa)) {
    return { valid: false, error: 'GPA is required' };
  }
  if (gpa < 0 || gpa > 4.0) {
    return { valid: false, error: 'GPA must be between 0 and 4.0' };
  }
  if (gpa < 3.0) {
    return { valid: false, error: 'Minimum GPA of 3.0 is required for co-op applications' };
  }
  return { valid: true };
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 8) {
    return { valid: false, error: 'Username must be at least 8 characters' };
  }
  return { valid: true };
}
