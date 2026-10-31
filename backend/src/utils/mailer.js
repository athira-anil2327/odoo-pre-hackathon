import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (emailUser && emailPass) {
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== "smtp.gmail.com") {
      cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    } else {
      // Direct Gmail service configuration (supports Google App Passwords)
      cachedTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    }
    return cachedTransporter;
  }

  // Create ethereal test account for local development/demo
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.warn("Failed to create test email account, using mock fallback:", err.message);
    return null;
  }
}

/**
 * Send Welcome Email with generated username and password to staff member
 */
export async function sendStaffWelcomeEmail({ to, name, username, password, loginUrl = "http://localhost:5173/signin" }) {
  const subject = "Welcome to BrightLoop — Your Staff Account Credentials";
  
  const textContent = `
Hello ${name},

An administrator has provisioned a Staff Operations account for you on the BrightLoop Subscription Management System.

Here are your account credentials:
------------------------------------------
Portal Sign In: ${loginUrl}
Username / Email: ${username}
Temporary Password: ${password}
------------------------------------------

For your security, please sign in and change your password upon initial login.

Regards,
BrightLoop Software Inc. Administrative Operations
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafb; margin: 0; padding: 24px; color: #122b2e; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eef2f3; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #183f42; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 12px; color: #bde4df; }
    .body { padding: 28px 24px; font-size: 13px; line-height: 1.6; }
    .cred-box { background: #f0f7f7; border: 1px solid #cce5e3; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .cred-label { color: #586f73; font-weight: 600; }
    .cred-value { font-family: monospace; font-weight: 700; color: #143e42; }
    .btn { display: block; text-align: center; background: #183f42; color: #ffffff !important; padding: 12px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; margin: 24px 0 12px; }
    .footer { padding: 16px 24px; background: #fafbfc; border-top: 1px solid #f0f4f5; text-align: center; font-size: 11px; color: #7e9599; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>BrightLoop Software</h1>
      <p>Staff Operations Workspace Onboarding</p>
    </div>
    <div class="body">
      <p>Hello <b>${name}</b>,</p>
      <p>An administrator has created your staff account for BrightLoop Subscription &amp; Billing Management. You can now access staff operations to manage proposals, client accounts, and billing runs.</p>
      
      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Login Portal:</span>
          <span class="cred-value">${loginUrl}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Username / Email:</span>
          <span class="cred-value">${username}</span>
        </div>
        <div class="cred-row" style="margin-bottom: 0;">
          <span class="cred-label">Assigned Password:</span>
          <span class="cred-value" style="color: #0f766e; font-size: 14px;">${password}</span>
        </div>
      </div>

      <a href="${loginUrl}" class="btn">Sign In to Staff Portal &rarr;</a>

      <p style="font-size: 11px; color: #7e9599; margin-top: 20px;">
        <em>Security reminder: Do not share these credentials with anyone. You can update your password under your profile once signed in.</em>
      </p>
    </div>
    <div class="footer">
      &copy; 2026 BrightLoop Software Inc. Automated Credential Dispatch.
    </div>
  </div>
</body>
</html>
`;

  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[SIMULATED EMAIL DISPATCH] To: ${to} | Username: ${username} | Password: ${password}`);
      return {
        sent: true,
        simulated: true,
        to,
        subject,
        message: "Simulated email logged to console."
      };
    }

    const emailSender = process.env.EMAIL_USER || process.env.SMTP_USER || "admin@brightloop.io";
    const fromAddress = process.env.SMTP_FROM || `"BrightLoop Operations" <${emailSender}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL DISPATCH SUCCESS] MessageId: ${info.messageId} | Recipient: ${to} | Sender: ${fromAddress}`);
    if (previewUrl) {
      console.log(`[EMAIL PREVIEW URL] ${previewUrl}`);
    }

    return {
      sent: true,
      realDispatch: !previewUrl,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
      recipient: to
    };
  } catch (err) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to send email to ${to}:`, err.message);
    return {
      sent: false,
      error: err.message,
      recipient: to
    };
  }
}
