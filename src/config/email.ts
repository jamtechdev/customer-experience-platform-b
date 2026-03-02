import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Email configuration for SMTP transporter
 * Set up email transporter using nodemailer for local SMTP (PaperCut) or external SMTP
 */
const smtpConfig: {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
} = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || '127.0.0.1',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '25'),
  secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
};

// Only add auth if credentials are provided
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
if (emailUser && emailPass) {
  smtpConfig.auth = {
    user: emailUser,
    pass: emailPass,
  };
}

export const emailTransporter = nodemailer.createTransport(smtpConfig);

/**
 * Email sender configuration
 */
export const emailConfig = {
  fromName: process.env.SMTP_FROM_NAME || 'Sentimenter CX',
  fromEmail: process.env.EMAIL_USER || process.env.SMTP_USER || 'no-reply@yourdomain.com',
};
