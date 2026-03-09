/**
 * Email Service using Nodemailer
 * 
 * Provides email functionality for:
 * - Password reset emails
 * - Welcome emails
 * - Notification emails
 * 
 * @module lib/email
 */

import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter
 * Supports both SMTP and Gmail
 */
const createTransporter = () => {
  // Gmail configuration
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // SMTP configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Development: use ethereal.email (test account)
  console.warn('⚠️  No email credentials configured. Using test account.');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'test@ethereal.email',
      pass: process.env.ETHEREAL_PASSWORD || 'test',
    },
  });
};

const transporter = createTransporter();

/**
 * Send an email
 * @param options - Email options (to, subject, html, text)
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MindPal" <noreply@mindpal.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent:', info.messageId);
    
    // Preview URL for ethereal.email
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send password reset email
 * @param to - Recipient email address
 * @param resetToken - Password reset token
 * @param resetUrl - Full URL for password reset
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #6366f1;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .token {
            background-color: #e5e7eb;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 MindPal Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for your MindPal account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${resetUrl}</div>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindPal Learning App. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Reset Your MindPal Password',
    html,
  });
}

/**
 * Send welcome email to new users
 * @param to - Recipient email address
 * @param name - User's name (optional)
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const displayName = name || 'there';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #6366f1;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 Welcome to MindPal!</h1>
          </div>
          <div class="content">
            <h2>Hi ${displayName}! 👋</h2>
            <p>Welcome to MindPal - your AI-powered learning companion!</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>📝 Upload documents and get AI-generated summaries</li>
              <li>🎴 Auto-generate flashcards for effective studying</li>
              <li>🔄 Use spaced repetition to maximize retention</li>
              <li>📊 Track your progress with detailed analytics</li>
              <li>👥 Collaborate in real-time study rooms</li>
            </ul>
            <a href="${process.env.WEB_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>
            <p>Happy learning! 🎓</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindPal Learning App. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Welcome to MindPal! 🎓',
    html,
  });
}

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
