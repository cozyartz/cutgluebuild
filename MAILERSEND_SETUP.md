# MailerSend Integration Setup Guide

This guide will help you set up MailerSend for CutGlueBuild's transactional email system.

## Overview

MailerSend is now fully integrated into CutGlueBuild and handles:

- **Welcome emails** - New user onboarding
- **Email verification** - Account security
- **Password reset** - Account recovery
- **Subscription notifications** - Billing updates
- **Invoice receipts** - Payment confirmations
- **Payment failure alerts** - Billing issues
- **Account deletion confirmations** - GDPR compliance
- **Newsletter subscriptions** - Marketing
- **Contact form submissions** - Support
- **Security alerts** - Account protection
- **Usage warnings** - Quota management
- **Trial expiration** - Conversion optimization

## Setup Instructions

### 1. MailerSend Account Setup

1. **Create Account**: Go to [MailerSend](https://app.mailersend.com) and create an account
2. **Verify Domain**: Add and verify your sending domain (e.g., `cutgluebuild.com`)
3. **Get API Key**: Navigate to Settings > API Tokens and create a new token

### 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# MailerSend Configuration
MAILERSEND_API_KEY=your_api_key_here
MAILERSEND_FROM_EMAIL=noreply@cutgluebuild.com
MAILERSEND_FROM_NAME=CutGlueBuild

# Template IDs (create these in MailerSend dashboard)
MAILERSEND_TEMPLATE_WELCOME=your_welcome_template_id
MAILERSEND_TEMPLATE_PASSWORD_RESET=your_password_reset_template_id
MAILERSEND_TEMPLATE_EMAIL_VERIFICATION=your_email_verification_template_id
MAILERSEND_TEMPLATE_SUBSCRIPTION=your_subscription_template_id
MAILERSEND_TEMPLATE_NEWSLETTER=your_newsletter_template_id
MAILERSEND_TEMPLATE_ACCOUNT_DELETION=your_account_deletion_template_id
MAILERSEND_TEMPLATE_PAYMENT_FAILED=your_payment_failed_template_id
MAILERSEND_TEMPLATE_TRIAL_EXPIRING=your_trial_expiring_template_id
MAILERSEND_TEMPLATE_USAGE_WARNING=your_usage_warning_template_id
MAILERSEND_TEMPLATE_SECURITY_ALERT=your_security_alert_template_id
MAILERSEND_TEMPLATE_PROJECT_SHARED=your_project_shared_template_id
MAILERSEND_TEMPLATE_INVOICE_RECEIPT=your_invoice_receipt_template_id
```

### 3. Database Migration

Run the email verification migration:

```bash
wrangler d1 execute cutgluebuild-db --file migrations/0004_email_verification.sql
```

### 4. Template Setup in MailerSend

Create the following email templates in your MailerSend dashboard:

#### Welcome Email Template
**Variables**: `user_name`, `login_url`
```html
<h1>Welcome to CutGlueBuild, {{user_name}}!</h1>
<p>Thank you for joining our AI-powered laser cutting platform.</p>
<a href="{{login_url}}">Get Started</a>
```

#### Email Verification Template
**Variables**: `verification_url`, `user_email`
```html
<h1>Verify Your Email Address</h1>
<p>Please click the link below to verify your email address:</p>
<a href="{{verification_url}}">Verify Email</a>
```

#### Password Reset Template
**Variables**: `reset_url`, `user_email`
```html
<h1>Reset Your Password</h1>
<p>Click the link below to reset your password:</p>
<a href="{{reset_url}}">Reset Password</a>
```

#### Subscription Notification Template
**Variables**: `user_name`, `plan_name`, `action`, `dashboard_url`
```html
<h1>Subscription {{action}}</h1>
<p>Hi {{user_name}},</p>
<p>Your subscription has been {{action}} to {{plan_name}}.</p>
<a href="{{dashboard_url}}">Manage Subscription</a>
```

#### Invoice Receipt Template
**Variables**: `user_name`, `invoice_number`, `amount`, `currency`, `plan_name`, `period_start`, `period_end`, `invoice_url`
```html
<h1>Payment Receipt</h1>
<p>Hi {{user_name}},</p>
<p>Payment received for {{plan_name}}: {{currency}} {{amount}}</p>
<p>Period: {{period_start}} - {{period_end}}</p>
<a href="{{invoice_url}}">View Invoice</a>
```

## Testing

### 1. Configuration Test

Visit `/admin/test-email` to check MailerSend configuration:

- Check status endpoint: `GET /api/test-email`
- Send test email: `POST /api/test-email` with `{"email": "test@example.com"}`

### 2. Integration Test

Test each email type by triggering the corresponding user action:

- **Welcome Email**: Create a new account
- **Email Verification**: Sign up or use resend verification
- **Password Reset**: Use forgot password form
- **Subscription**: Change subscription in Stripe
- **Contact Form**: Submit contact form

### 3. Webhook Testing

Use Stripe CLI to test webhook events:

```bash
stripe listen --forward-to localhost:4321/api/billing/webhooks
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Implementation Details

### Service Architecture

The `MailerSendService` class provides:

- **Graceful fallbacks** - Works without API key (logs instead)
- **Template support** - Uses MailerSend templates with variables
- **Error handling** - Doesn't break user flows if email fails
- **Security** - Input validation and sanitization

### Integration Points

1. **Authentication** (`src/lib/auth.ts`)
   - Welcome emails on signup
   - Password reset emails
   - Email verification tokens

2. **Stripe Webhooks** (`src/pages/api/billing/webhooks.ts`)
   - Subscription change notifications
   - Payment success receipts
   - Payment failure alerts

3. **Contact Forms** (`src/pages/api/contact.ts`)
   - Support request routing
   - Privacy request handling

4. **Newsletter** (`src/pages/api/newsletter.ts`)
   - Subscription confirmations
   - Welcome series

### Email Types Reference

| Email Type | Trigger | Template Variables |
|------------|---------|-------------------|
| Welcome | User signup | `user_name`, `login_url` |
| Email Verification | Signup/resend | `verification_url`, `user_email` |
| Password Reset | Forgot password | `reset_url`, `user_email` |
| Subscription Change | Stripe webhook | `user_name`, `plan_name`, `action` |
| Invoice Receipt | Payment success | `user_name`, `amount`, `invoice_number` |
| Payment Failed | Payment failure | `user_name`, `amount`, `currency` |
| Account Deletion | Account delete | `user_name`, `deletion_date` |
| Newsletter | Newsletter signup | `user_email`, `unsubscribe_url` |
| Contact Form | Form submission | `name`, `email`, `subject`, `message` |
| Security Alert | Security event | `alert_type`, `ip_address`, `location` |
| Usage Warning | Quota reached | `user_name`, `usage_percent`, `limit_type` |
| Trial Expiring | Trial ending | `user_name`, `days_remaining` |

## Troubleshooting

### Common Issues

1. **Domain not verified**: Verify your sending domain in MailerSend
2. **Template not found**: Check template IDs in environment variables
3. **Rate limiting**: MailerSend has sending limits on free plans
4. **Webhook failures**: Ensure Stripe webhook endpoint is configured

### Debug Information

- Check MailerSend service status: `GET /api/test-email`
- View service configuration in logs
- Monitor webhook processing in Cloudflare dashboard
- Check email delivery in MailerSend dashboard

### Monitoring

Set up monitoring for:
- Email delivery rates
- Bounce rates
- Template rendering errors
- API quota usage

## Production Deployment

1. **Domain Authentication**: Set up SPF, DKIM, and DMARC records
2. **Template Optimization**: Test templates across email clients
3. **Monitoring**: Set up alerts for delivery failures
4. **Compliance**: Ensure GDPR/CAN-SPAM compliance
5. **Backup**: Consider fallback email service for critical emails

## Security Considerations

- API keys are environment variables only
- All email addresses are validated before sending
- Rate limiting prevents spam
- Sensitive data is not logged
- Email verification prevents account takeovers
- Templates use XSS-safe variable substitution

## Support

For MailerSend-specific issues:
- [MailerSend Documentation](https://developers.mailersend.com/)
- [MailerSend Support](https://www.mailersend.com/help)

For integration issues:
- Check server logs in Cloudflare dashboard
- Test endpoints using `/admin/test-email`
- Verify environment variables are set correctly