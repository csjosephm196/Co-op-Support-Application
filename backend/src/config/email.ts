import '../loadEnv';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@csa-portal.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function verificationEmail(code: string) {
  return {
    subject: 'CSA - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Co-op Support Application</h2>
        <p>Your verification code is:</p>
        <div style="background: #eff6ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
      </div>
    `,
  };
}

export function invitationEmail(name: string, role: string, link: string) {
  return {
    subject: `CSA - You've Been Invited as a ${role}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Co-op Support Application</h2>
        <p>Hello ${name},</p>
        <p>You have been invited to join the Co-op Support Application as a <strong>${role}</strong>.</p>
        <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
          Accept Invitation & Sign Up
        </a>
        <p style="color: #6b7280; font-size: 14px;">This invitation link is one-time use and expires in 7 days.</p>
      </div>
    `,
  };
}

export function applicationDecisionEmail(name: string, status: string) {
  const accepted = status === 'finally_accepted';
  return {
    subject: `CSA - Application ${accepted ? 'Accepted' : 'Rejected'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Co-op Support Application</h2>
        <p>Hello ${name},</p>
        <p>Your co-op application has been <strong>${accepted ? 'accepted' : 'rejected'}</strong>.</p>
        ${accepted
          ? '<p>Congratulations! Please log in to the portal for next steps.</p>'
          : '<p>We appreciate your interest. Please contact the co-op office for more information.</p>'
        }
      </div>
    `,
  };
}

export function reminderEmail(name: string, documentType: string) {
  return {
    subject: 'CSA - Overdue Document Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Co-op Support Application</h2>
        <p>Hello ${name},</p>
        <p>This is a reminder that your <strong>${documentType}</strong> is overdue. Please submit it as soon as possible.</p>
        <p>Log in to the CSA portal to upload your document.</p>
      </div>
    `,
  };
}

export default transporter;
