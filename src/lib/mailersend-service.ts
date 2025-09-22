import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export interface EmailTemplate {
  templateId: string;
  variables?: Record<string, any>;
}

export interface EmailOptions {
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  template?: EmailTemplate;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export class MailerSendService {
  private mailersend: MailerSend;
  private defaultSender: Sender;
  private isConfigured: boolean;

  constructor() {
    const apiKey = process.env.MAILERSEND_API_KEY;
    this.isConfigured = !!apiKey;

    if (this.isConfigured) {
      this.mailersend = new MailerSend({
        apiKey: apiKey!,
      });

      this.defaultSender = new Sender(
        process.env.MAILERSEND_FROM_EMAIL || 'noreply@cutgluebuild.com',
        process.env.MAILERSEND_FROM_NAME || 'CutGlueBuild'
      );
    } else {
      console.warn('MailerSend API key not configured. Email functionality will be disabled.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Mock email send:', options);
      return true;
    }

    try {
      const recipients = Array.isArray(options.to)
        ? options.to.map(email => new Recipient(email))
        : [new Recipient(options.to)];

      const emailParams = new EmailParams()
        .setFrom(this.defaultSender)
        .setTo(recipients);

      if (options.subject) {
        emailParams.setSubject(options.subject);
      }

      if (options.text) {
        emailParams.setText(options.text);
      }

      if (options.html) {
        emailParams.setHtml(options.html);
      }

      if (options.template) {
        emailParams.setTemplateId(options.template.templateId);
        if (options.template.variables) {
          emailParams.setVariables([{
            email: Array.isArray(options.to) ? options.to[0] : options.to,
            substitutions: options.template.variables
          }]);
        }
      }

      if (options.replyTo) {
        emailParams.setReplyTo(new Recipient(options.replyTo));
      }

      if (options.cc) {
        emailParams.setCc(options.cc.map(email => new Recipient(email)));
      }

      if (options.bcc) {
        emailParams.setBcc(options.bcc.map(email => new Recipient(email)));
      }

      const response = await this.mailersend.email.send(emailParams);
      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to CutGlueBuild!',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_WELCOME || '',
        variables: {
          user_name: userName,
          login_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/login`
        }
      }
    });
  }

  // Password reset email
  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.BASE_URL || 'https://cutgluebuild.com'}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Reset your CutGlueBuild password',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_PASSWORD_RESET || '',
        variables: {
          reset_url: resetUrl,
          user_email: userEmail
        }
      }
    });
  }

  // Email verification
  async sendEmailVerification(userEmail: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.BASE_URL || 'https://cutgluebuild.com'}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Verify your CutGlueBuild email address',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_EMAIL_VERIFICATION || '',
        variables: {
          verification_url: verificationUrl,
          user_email: userEmail
        }
      }
    });
  }

  // Subscription notification email
  async sendSubscriptionNotification(userEmail: string, userName: string, planName: string, action: 'upgraded' | 'downgraded' | 'cancelled'): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Your CutGlueBuild subscription has been ${action}`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_SUBSCRIPTION || '',
        variables: {
          user_name: userName,
          plan_name: planName,
          action: action,
          dashboard_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/account`
        }
      }
    });
  }

  // Support/contact email
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

  // Newsletter subscription confirmation
  async sendNewsletterConfirmation(userEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to CutGlueBuild Newsletter!',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_NEWSLETTER || '',
        variables: {
          user_email: userEmail,
          unsubscribe_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/unsubscribe?email=${encodeURIComponent(userEmail)}`
        }
      }
    });
  }

  // Account deletion confirmation
  async sendAccountDeletionConfirmation(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Your CutGlueBuild account has been deleted',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_ACCOUNT_DELETION || '',
        variables: {
          user_name: userName,
          deletion_date: new Date().toLocaleDateString(),
          support_email: 'support@cutgluebuild.com'
        }
      }
    });
  }

  // Payment failed notification
  async sendPaymentFailedNotification(userEmail: string, userName: string, amount: number, currency: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Payment failed - Action required',
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_PAYMENT_FAILED || '',
        variables: {
          user_name: userName,
          amount: amount,
          currency: currency.toUpperCase(),
          update_payment_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/account/billing`,
          support_email: 'support@cutgluebuild.com'
        }
      }
    });
  }

  // Trial expiring notification
  async sendTrialExpiringNotification(userEmail: string, userName: string, daysRemaining: number): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Your CutGlueBuild trial expires in ${daysRemaining} days`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_TRIAL_EXPIRING || '',
        variables: {
          user_name: userName,
          days_remaining: daysRemaining,
          upgrade_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/pricing`,
          features_lost: 'Premium templates, Unlimited AI generation, Priority support'
        }
      }
    });
  }

  // Usage limit warning
  async sendUsageLimitWarning(userEmail: string, userName: string, usagePercent: number, limitType: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `You've used ${usagePercent}% of your ${limitType} limit`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_USAGE_WARNING || '',
        variables: {
          user_name: userName,
          usage_percent: usagePercent,
          limit_type: limitType,
          upgrade_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/pricing`,
          current_plan: 'Free'
        }
      }
    });
  }

  // Account security alert
  async sendSecurityAlert(userEmail: string, alertType: string, ipAddress?: string, location?: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Security Alert: ${alertType}`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_SECURITY_ALERT || '',
        variables: {
          alert_type: alertType,
          ip_address: ipAddress || 'Unknown',
          location: location || 'Unknown location',
          timestamp: new Date().toISOString(),
          account_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/account/security`
        }
      }
    });
  }

  // Project shared notification
  async sendProjectSharedNotification(recipientEmail: string, sharedByName: string, projectName: string, shareUrl: string): Promise<boolean> {
    return this.sendEmail({
      to: recipientEmail,
      subject: `${sharedByName} shared a CutGlueBuild project with you`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_PROJECT_SHARED || '',
        variables: {
          shared_by_name: sharedByName,
          project_name: projectName,
          share_url: shareUrl,
          platform_name: 'CutGlueBuild'
        }
      }
    });
  }

  // Invoice receipt
  async sendInvoiceReceipt(userEmail: string, userName: string, invoiceData: {
    invoiceNumber: string;
    amount: number;
    currency: string;
    planName: string;
    periodStart: string;
    periodEnd: string;
    invoiceUrl: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Receipt for CutGlueBuild subscription - Invoice #${invoiceData.invoiceNumber}`,
      template: {
        templateId: process.env.MAILERSEND_TEMPLATE_INVOICE_RECEIPT || '',
        variables: {
          user_name: userName,
          invoice_number: invoiceData.invoiceNumber,
          amount: invoiceData.amount,
          currency: invoiceData.currency.toUpperCase(),
          plan_name: invoiceData.planName,
          period_start: invoiceData.periodStart,
          period_end: invoiceData.periodEnd,
          invoice_url: invoiceData.invoiceUrl,
          billing_portal_url: `${process.env.BASE_URL || 'https://cutgluebuild.com'}/account/billing`
        }
      }
    });
  }

  // Generic notification email
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

  // Check if MailerSend is properly configured
  isReady(): boolean {
    return this.isConfigured;
  }

  // Get configuration status for debugging
  getStatus(): { configured: boolean; sender: string } {
    return {
      configured: this.isConfigured,
      sender: this.defaultSender?.email || 'Not configured'
    };
  }
}

// Export singleton instance
export const mailerSendService = new MailerSendService();