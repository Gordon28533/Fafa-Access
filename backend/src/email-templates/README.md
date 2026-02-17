# Email Templates Documentation

Professional, mobile-responsive email templates for the Fafa Access Laptop Distribution Program.

## Overview

This directory contains production-ready HTML email templates for transactional notifications. All templates are:

- **Mobile-Responsive**: Optimized for desktop, tablet, and mobile viewing
- **Professional Design**: Clean, modern UI with brand colors
- **Accessible**: Semantic HTML with proper contrast ratios
- **GDPR Compliant**: Clear unsubscribe and contact information
- **Template-Ready**: Supports `{{placeholder}}` variable substitution

## Templates

### 1. Application Submitted
**File:** `applicationSubmitted.html`
**Purpose:** Confirmation that the student's application has been received

**Variables:**
- `{{name}}` - Student's full name
- `{{applicationRef}}` - Application reference number (e.g., APP-2026-0001)
- `{{submissionDate}}` - Date application was submitted
- `{{dashboardUrl}}` - Link to application dashboard

**Color Scheme:** Purple gradient
**Status Badge:** "Pending SRC Review"

---

### 2. Application Approved
**File:** `applicationApproved.html`
**Purpose:** Notification that the application has been approved by SRC and Admin

**Variables:**
- `{{name}}` - Student's full name
- `{{applicationRef}}` - Application reference number
- `{{approvalDate}}` - Date of approval
- `{{laptopModel}}` - Model/description of approved laptop
- `{{dashboardUrl}}` - Link to application dashboard

**Color Scheme:** Green gradient
**Status Badge:** "Approved"
**Features:** 
- Timeline showing next steps
- Clear delivery scheduling information
- Important notes about payment

---

### 3. Application Rejected
**File:** `applicationRejected.html`
**Purpose:** Notification that the application was not approved

**Variables:**
- `{{name}}` - Student's full name
- `{{applicationRef}}` - Application reference number
- `{{decisionDate}}` - Date of decision
- `{{rejectionReason}}` - Explanation for rejection

**Color Scheme:** Red gradient
**Features:**
- Clear rejection reason display
- Appeal process information
- Resources and support options
- Reapplication eligibility information

---

### 4. Delivery Scheduled
**File:** `deliveryScheduled.html`
**Purpose:** Confirmation and details of scheduled laptop delivery

**Variables:**
- `{{name}}` - Student's full name
- `{{applicationRef}}` - Application reference number
- `{{deliveryDate}}` - Date of delivery (format: YYYY-MM-DD)
- `{{deliveryTimeWindow}}` - Time window (e.g., "9:00 AM - 5:00 PM")
- `{{agentName}}` - Name of delivery agent
- `{{location}}` - Delivery location
- `{{agentPhone}}` - Agent's contact phone number
- `{{dashboardUrl}}` - Link to application dashboard

**Color Scheme:** Blue gradient
**Features:**
- Prominent delivery details box with icons
- Pre-delivery checklist
- Rescheduling information
- Important payment reminder

---

### 5. Payment Required
**File:** `paymentRequired.html`
**Purpose:** Payment notification after laptop delivery

**Variables:**
- `{{name}}` - Student's full name
- `{{applicationRef}}` - Application reference number
- `{{amount}}` - Amount due (e.g., "GHS 500.00")
- `{{paymentDueDate}}` - Payment deadline date

**Color Scheme:** Amber/Gold gradient
**Features:**
- Prominent amount display
- Multiple payment method options (Cash, Mobile Money, Bank Transfer)
- Payment timeline
- Late payment warnings
- Contact information for issues

---

## Usage in Application

### Loading Templates

The email service automatically loads templates from this directory. To use in code:

```javascript
import { sendApplicationSubmittedEmail } from './emailNotifications.js';

await sendApplicationSubmittedEmail('student@example.com', {
  name: 'John Doe',
  applicationRef: 'APP-2026-0001',
  submissionDate: new Date().toLocaleDateString('en-GB'),
  dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
});
```

### Variable Substitution

Variables use the `{{variableName}}` format and are replaced at runtime:

```html
<!-- In template -->
<p>Dear {{name}},</p>

<!-- After substitution -->
<p>Dear John Doe,</p>
```

## Design System

### Colors
- **Primary (Purple):** `#667eea` - Application status
- **Success (Green):** `#10b981` - Approvals, confirmations
- **Error (Red):** `#ef4444` - Rejections
- **Info (Blue):** `#3b82f6` - Delivery information
- **Warning (Amber):** `#f59e0b` - Payment, important notices

### Typography
- **Font Stack:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Base Font Size:** 14px
- **Heading 1 (h1):** 28px, bold
- **Heading 3 (h3):** 16px, semibold
- **Body Text:** 14-15px, regular

### Spacing
- **Container Max Width:** 600px (desktop optimized)
- **Padding (Large Sections):** 40px
- **Padding (Mobile):** 30px (20px on small screens)
- **Section Margins:** 25px

### Responsive Breakpoints
- **Desktop:** Max-width 600px
- **Tablet:** No explicit breakpoint (uses fluid layout)
- **Mobile:** Max-width 100% with adjusted padding

## Customization

### Brand Colors
To change brand colors, update the gradient and accent colors in each template's `<style>` section:

```css
/* Example: Change primary color from purple to blue */
.header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

### Logo Addition
To add a logo, insert below the opening `<div class="header">`:

```html
<div class="header">
  <img src="https://your-cdn.com/logo.png" alt="Fafa Access" style="max-width: 150px; margin-bottom: 20px;">
  <h1>Application Received</h1>
  ...
</div>
```

### Footer Customization
Update the footer links and contact information in the footer section:

```html
<div class="footer-links">
  <a href="https://your-site.com/help">Your Custom Link</a>
  <a href="https://your-site.com/contact">Contact</a>
</div>
```

## Testing

### Email Client Compatibility
These templates are compatible with:
- Gmail (Web, Mobile, App)
- Outlook (Web, Desktop)
- Apple Mail
- Microsoft Outlook
- Thunderbird
- Mobile email clients (iOS Mail, Android Gmail)

### Preview
1. Open any template in a web browser to preview live rendering
2. Use Firefox DevTools (right-click → Inspect) for responsive testing
3. Test on actual email clients using services like Litmus or Email on Acid

### Test Variables
For testing purposes, use these sample variables:

```javascript
{
  name: 'Jane Smith',
  applicationRef: 'APP-2026-0001',
  submissionDate: '6 Feb 2026',
  approvalDate: '6 Feb 2026',
  decisionDate: '6 Feb 2026',
  laptopModel: 'Dell Inspiron 15',
  deliveryDate: '13 Feb 2026',
  deliveryTimeWindow: '9:00 AM - 5:00 PM',
  agentName: 'John Mensah',
  location: 'Main Campus Legon',
  agentPhone: '+233 24 123 4567',
  amount: 'GHS 500.00',
  paymentDueDate: '20 Feb 2026',
  rejectionReason: 'Application requirements not met',
  dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
}
```

## Best Practices

1. **Always Provide All Variables:** Missing variables will display as `{{variableName}}`
2. **Date Formatting:** Use consistent date format (e.g., 'en-GB': "6 Feb 2026")
3. **Phone Numbers:** Include country code for international compatibility
4. **Currency:** Include currency code (e.g., "GHS 500.00")
5. **URLs:** Always use full URLs with protocol (https://)
6. **Plain Text Alt:** Templates include plain text versions for email clients that don't support HTML

## Accessibility

All templates meet WCAG 2.1 Level AA standards:
- ✅ Sufficient color contrast ratios (4.5:1 or higher)
- ✅ Semantic HTML structure
- ✅ No critical colors as sole indicator
- ✅ Clear hierarchy and readability
- ✅ Mobile-friendly layout

## File Structure

```
src/email-templates/
├── applicationSubmitted.html
├── applicationApproved.html
├── applicationRejected.html
├── deliveryScheduled.html
├── paymentRequired.html
├── README.md (this file)
```

## Related Files

- `src/services/emailNotifications.js` - Email notification wrappers
- `src/services/TransactionalEmailService.js` - Email service implementation
- `src/services/TransactionalEmailService.js` (lines 188-560) - Inline template examples

## Maintenance

- Review templates quarterly for brand alignment
- Test in actual email clients when making changes
- Keep file sizes minimal for faster loading
- Verify all placeholder variables match the email notification functions

## Support

For template issues or customization requests, contact the development team.

---

**Last Updated:** February 6, 2026
**Version:** 1.0
**Status:** Production Ready ✅
