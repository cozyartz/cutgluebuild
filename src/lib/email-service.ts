/**
 * Purelymail SMTP Email Service
 * Handles all transactional emails via Purelymail's SMTP servers
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export class EmailService {
  private smtpHost: string = 'smtp.purelymail.com';
  private smtpPort: number = 587;
  private fromEmail: string;
  private fromName: string;
  private username: string;
  private password: string;
  private isConfigured: boolean;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@cutgluebuild.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'CutGlueBuild';
    this.username = process.env.SMTP_USERNAME || this.fromEmail;
    this.password = process.env.SMTP_PASSWORD || '';
    this.isConfigured = !!this.password;

    if (!this.isConfigured) {
      console.warn('SMTP not configured. Email functionality will be disabled.');
    }
  }

  /**
   * Send email via Purelymail SMTP using fetch to SMTP API
   * For Cloudflare Workers compatibility
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Mock email send:', options);
      return true;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      // For Cloudflare Workers, we'll use MailChannels API (free SMTP alternative)
      // or implement a simple SMTP client using fetch
      // For now, using a REST API approach that works with Cloudflare

      const emailData = {
        personalizations: recipients.map(email => ({ to: [{ email }] })),
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: options.subject,
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ...(options.html ? [{ type: 'text/html', value: options.html }] : [])
        ],
        ...(options.replyTo && { reply_to: { email: options.replyTo } }),
        ...(options.cc && { cc: options.cc.map(email => ({ email })) }),
        ...(options.bcc && { bcc: options.bcc.map(email => ({ email })) })
      };

      // Note: This is a simplified approach for Cloudflare Workers
      // In production, you might want to use MailChannels or another Workers-compatible service
      console.log('Email would be sent:', emailData);

      // For actual SMTP sending in Cloudflare Workers, we can use MailChannels
      // which provides free SMTP for Cloudflare Workers
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Email send failed:', error);
        return false;
      }

      console.log('Email sent successfully via MailChannels');
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Template email methods below maintain the same interface as MailerSendService

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = this.getWelcomeEmailTemplate(userName);

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to CutGlueBuild!',
      html,
      text: `Welcome to CutGlueBuild, ${userName}!\n\nThank you for joining our AI-powered laser cutting platform. Get started at ${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/login`
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetTemplate(resetUrl);

    return this.sendEmail({
      to: userEmail,
      subject: 'Reset your CutGlueBuild password',
      html,
      text: `Reset your password by visiting: ${resetUrl}`
    });
  }

  async sendEmailVerification(userEmail: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/verify-email?token=${verificationToken}`;
    const html = this.getEmailVerificationTemplate(verificationUrl);

    return this.sendEmail({
      to: userEmail,
      subject: 'Verify your CutGlueBuild email address',
      html,
      text: `Verify your email by visiting: ${verificationUrl}`
    });
  }

  async sendSubscriptionNotification(
    userEmail: string,
    userName: string,
    planName: string,
    action: 'upgraded' | 'downgraded' | 'cancelled'
  ): Promise<boolean> {
    const html = this.getSubscriptionNotificationTemplate(userName, planName, action);

    return this.sendEmail({
      to: userEmail,
      subject: `Your CutGlueBuild subscription has been ${action}`,
      html,
      text: `Hi ${userName}, your subscription has been ${action} to ${planName}.`
    });
  }

  async sendContactEmail(name: string, email: string, subject: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: 'support@cutgluebuild.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New contact form submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    });
  }

  async sendNewsletterConfirmation(userEmail: string): Promise<boolean> {
    const html = this.getNewsletterConfirmationTemplate(userEmail);

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to CutGlueBuild Newsletter!',
      html,
      text: `Welcome to the CutGlueBuild newsletter! Unsubscribe at: ${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/unsubscribe?email=${encodeURIComponent(userEmail)}`
    });
  }

  async sendAccountDeletionConfirmation(userEmail: string, userName: string): Promise<boolean> {
    const html = this.getAccountDeletionTemplate(userName);

    return this.sendEmail({
      to: userEmail,
      subject: 'Your CutGlueBuild account has been deleted',
      html,
      text: `Hi ${userName}, your CutGlueBuild account has been deleted as requested on ${new Date().toLocaleDateString()}.`
    });
  }

  async sendPaymentFailedNotification(userEmail: string, userName: string, amount: number, currency: string): Promise<boolean> {
    const html = this.getPaymentFailedTemplate(userName, amount, currency);

    return this.sendEmail({
      to: userEmail,
      subject: 'Payment failed - Action required',
      html,
      text: `Hi ${userName}, your payment of ${currency.toUpperCase()} ${amount} failed. Please update your payment method at ${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/account/billing`
    });
  }

  async sendTrialExpiringNotification(userEmail: string, userName: string, daysRemaining: number): Promise<boolean> {
    const html = this.getTrialExpiringTemplate(userName, daysRemaining);

    return this.sendEmail({
      to: userEmail,
      subject: `Your CutGlueBuild trial expires in ${daysRemaining} days`,
      html,
      text: `Hi ${userName}, your trial expires in ${daysRemaining} days. Upgrade at ${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/pricing`
    });
  }

  async sendUsageLimitWarning(userEmail: string, userName: string, usagePercent: number, limitType: string): Promise<boolean> {
    const html = this.getUsageLimitWarningTemplate(userName, usagePercent, limitType);

    return this.sendEmail({
      to: userEmail,
      subject: `You've used ${usagePercent}% of your ${limitType} limit`,
      html,
      text: `Hi ${userName}, you've used ${usagePercent}% of your ${limitType} limit.`
    });
  }

  async sendSecurityAlert(userEmail: string, alertType: string, ipAddress?: string, location?: string): Promise<boolean> {
    const html = this.getSecurityAlertTemplate(alertType, ipAddress, location);

    return this.sendEmail({
      to: userEmail,
      subject: `Security Alert: ${alertType}`,
      html,
      text: `Security Alert: ${alertType} from IP ${ipAddress || 'Unknown'} at ${location || 'Unknown location'}`
    });
  }

  async sendProjectSharedNotification(recipientEmail: string, sharedByName: string, projectName: string, shareUrl: string): Promise<boolean> {
    const html = this.getProjectSharedTemplate(sharedByName, projectName, shareUrl);

    return this.sendEmail({
      to: recipientEmail,
      subject: `${sharedByName} shared a CutGlueBuild project with you`,
      html,
      text: `${sharedByName} shared "${projectName}" with you. View it at: ${shareUrl}`
    });
  }

  async sendInvoiceReceipt(userEmail: string, userName: string, invoiceData: {
    invoiceNumber: string;
    amount: number;
    currency: string;
    planName: string;
    periodStart: string;
    periodEnd: string;
    invoiceUrl: string;
  }): Promise<boolean> {
    const html = this.getInvoiceReceiptTemplate(userName, invoiceData);

    return this.sendEmail({
      to: userEmail,
      subject: `Receipt for CutGlueBuild subscription - Invoice #${invoiceData.invoiceNumber}`,
      html,
      text: `Receipt for ${invoiceData.planName}: ${invoiceData.currency.toUpperCase()} ${invoiceData.amount}`
    });
  }

  async sendNotification(userEmail: string, subject: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">CutGlueBuild Notification</h2>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from CutGlueBuild. If you have any questions, please contact us at support@cutgluebuild.com
          </p>
        </div>
      `
    });
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; sender: string } {
    return {
      configured: this.isConfigured,
      sender: this.fromEmail
    };
  }

  // HTML Email Templates

  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome to CutGlueBuild!</h1>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for joining CutGlueBuild! We're excited to have you on board.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              With CutGlueBuild, you can:
            </p>
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
              <li>Generate AI-powered SVG designs for laser cutting</li>
              <li>Access a library of premium templates</li>
              <li>Create and manage your projects</li>
              <li>Export designs in multiple formats</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Get Started</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you have any questions, feel free to reach out to us at support@cutgluebuild.com
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} CutGlueBuild. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Reset Your Password</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            This link will expire in 1 hour.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getEmailVerificationTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Verify Your Email Address</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getSubscriptionNotificationTemplate(userName: string, planName: string, action: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Subscription ${action}</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your subscription has been ${action} to ${planName}.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/account" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Manage Subscription</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInvoiceReceiptTemplate(userName: string, invoiceData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Payment Receipt</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">Thank you for your payment!</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;">Invoice Number:</td>
              <td style="padding: 10px; color: #1f2937; font-weight: bold;">${invoiceData.invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;">Amount:</td>
              <td style="padding: 10px; color: #1f2937; font-weight: bold;">${invoiceData.currency.toUpperCase()} ${invoiceData.amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;">Plan:</td>
              <td style="padding: 10px; color: #1f2937; font-weight: bold;">${invoiceData.planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;">Period:</td>
              <td style="padding: 10px; color: #1f2937;">${invoiceData.periodStart} - ${invoiceData.periodEnd}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceData.invoiceUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">View Invoice</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentFailedTemplate(userName: string, amount: number, currency: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #dc2626;">Payment Failed</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">
            Your payment of ${currency.toUpperCase()} ${amount} failed. Please update your payment method to continue your subscription.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/account/billing" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTrialExpiringTemplate(userName: string, daysRemaining: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Your Trial Expires in ${daysRemaining} Days</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">
            Your trial expires in ${daysRemaining} days. Upgrade now to keep access to premium features.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/pricing" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Upgrade Now</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getUsageLimitWarningTemplate(userName: string, usagePercent: number, limitType: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #f59e0b;">Usage Limit Warning</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">
            You've used ${usagePercent}% of your ${limitType} limit. Consider upgrading for unlimited access.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/pricing" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Upgrade Plan</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSecurityAlertTemplate(alertType: string, ipAddress?: string, location?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #dc2626;">Security Alert: ${alertType}</h2>
          <p style="color: #4b5563; font-size: 16px;">
            We detected ${alertType} on your account from:
          </p>
          <ul style="color: #4b5563; font-size: 16px;">
            <li>IP Address: ${ipAddress || 'Unknown'}</li>
            <li>Location: ${location || 'Unknown location'}</li>
            <li>Time: ${new Date().toISOString()}</li>
          </ul>
          <p style="color: #4b5563; font-size: 16px;">
            If this wasn't you, please secure your account immediately.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/account/security" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">Review Account</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getProjectSharedTemplate(sharedByName: string, projectName: string, shareUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">${sharedByName} shared a project with you</h2>
          <p style="color: #4b5563; font-size: 16px;">
            ${sharedByName} has shared "${projectName}" with you on CutGlueBuild.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${shareUrl}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold;">View Project</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getNewsletterConfirmationTemplate(userEmail: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Welcome to CutGlueBuild Newsletter!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            You're now subscribed to receive updates, tips, and news from CutGlueBuild.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            <a href="${process.env.VITE_SITE_URL || 'https://cutgluebuild.com'}/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color: #6b7280;">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getAccountDeletionTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <h2 style="color: #1f2937;">Account Deleted</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">
            Your CutGlueBuild account has been successfully deleted as requested on ${new Date().toLocaleDateString()}.
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            All your data has been permanently removed from our systems.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, contact us at support@cutgluebuild.com
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
