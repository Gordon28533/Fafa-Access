# Email Template Integration Guide

Complete guide for integrating HTML email templates into the Fafa Access email service.

## Integration Approach

The email templates can be integrated in two ways:

1. **File-Based Loading** (Recommended for production)
2. **Direct String Embedding** (Current approach)

## Option 1: File-Based Loading (Recommended)

### Advantages:
- Cleaner code (no inline HTML)
- Easier template updates (no code changes)
- Better version control
- Faster compile time
- Professional separation of concerns

### Implementation Steps

#### Step 1: Create Template Loader Utility

Create `src/services/emailTemplateLoader.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../email-templates');

/**
 * Load email template from file
 * @param {string} templateName - Template filename (e.g., 'applicationSubmitted.html')
 * @returns {string} Template HTML content
 */
export function loadTemplate(templateName) {
  try {
    const templatePath = path.join(TEMPLATE_DIR, templateName);
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Replace placeholders in template with values
 * @param {string} template - Template HTML with {{placeholder}} syntax
 * @param {object} variables - Object with placeholder keys and values
 * @returns {string} Rendered HTML with placeholders replaced
 */
export function renderTemplate(template, variables = {}) {
  let rendered = template;
  
  // Replace all {{variable}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  });
  
  // Log any unreplaced placeholders (potential issues)
  const unreplaced = rendered.match(/{{[\w]+}}/g);
  if (unreplaced) {
    console.warn('Unreplaced placeholders in email:', unreplaced);
  }
  
  return rendered;
}

/**
 * Generate full email with template
 * @param {string} templateName - Template filename
 * @param {object} variables - Template variables
 * @returns {string} Rendered HTML email
 */
export function generateEmail(templateName, variables) {
  const template = loadTemplate(templateName);
  return renderTemplate(template, variables);
}
```

#### Step 2: Update TransactionalEmailService.js

Instead of inline templates, reference the loader:

```javascript
import { generateEmail } from './emailTemplateLoader.js';

// Old approach (remove):
// const emailTemplates = {
//   applicationSubmitted: {
//     subject: 'Application Received',
//     htmlTemplate: '<html>...</html>'
//   }
// };

// New approach:
const emailTemplates = {
  applicationSubmitted: {
    subject: 'Application Received',
    templateFile: 'applicationSubmitted.html'
  },
  applicationApproved: {
    subject: 'Congratulations! Your Application is Approved',
    templateFile: 'applicationApproved.html'
  },
  applicationRejected: {
    subject: 'Application Decision',
    templateFile: 'applicationRejected.html'
  },
  deliveryScheduled: {
    subject: 'Your Laptop Delivery is Scheduled',
    templateFile: 'deliveryScheduled.html'
  },
  paymentRequired: {
    subject: 'Payment Required',
    templateFile: 'paymentRequired.html'
  }
};

// Update sendEmail function
async function sendEmail(to, templateKey, variables = {}, cc = null) {
  const template = emailTemplates[templateKey];
  if (!template) {
    throw new Error(`Unknown email template: ${templateKey}`);
  }
  
  try {
    // Load and render the template
    const htmlContent = generateEmail(template.templateFile, variables);
    
    // Send via your email provider (SendGrid, AWS SES, etc.)
    const email = {
      to,
      cc,
      subject: template.subject,
      html: htmlContent,
      template: templateKey,
      timestamp: new Date().toISOString()
    };
    
    // Your email sending logic here
    await emailProvider.send(email);
    
    return email;
  } catch (error) {
    console.error(`Failed to send email for template ${templateKey}:`, error);
    throw error;
  }
}
```

#### Step 3: Update Email Notification Functions

Update `src/services/emailNotifications.js` to use the new approach:

```javascript
// Before
export async function sendApplicationSubmittedEmail(to, data) {
  const html = `<html>...</html>`; // Old inline
  // Send email...
}

// After
export async function sendApplicationSubmittedEmail(to, data) {
  const variables = {
    name: data.name,
    applicationRef: data.applicationRef,
    submissionDate: data.submissionDate,
    dashboardUrl: data.dashboardUrl
  };
  
  return sendEmail(to, 'applicationSubmitted', variables);
}
```

## Option 2: Direct String Embedding (Current Approach)

If you prefer to keep templates as inline strings for now:

### Advantages:
- No file I/O at runtime
- All dependencies bundled
- Simpler deployment (no extra files)

### Disadvantages:
- Large files in code
- Template updates require code changes
- Harder to maintain

### Implementation:

Copy the HTML from each template file and embed in `TransactionalEmailService.js`:

```javascript
const emailTemplates = {
  applicationSubmitted: {
    subject: 'Application Received',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <!-- Copy full HTML from applicationSubmitted.html -->
      </html>
    `
  }
};
```

## Migration Path

### Recommended Sequence:

1. **Week 1: Preparation**
   - Create `emailTemplateLoader.js` utility
   - Add comprehensive tests for template loading/rendering

2. **Week 2: Integration**
   - Update `TransactionalEmailService.js` to use loader
   - Update `emailNotifications.js` function signatures
   - Run integration tests

3. **Week 3: Testing**
   - Test with actual email clients (Gmail, Outlook, etc.)
   - Verify placeholder replacement works correctly
   - Test with edge cases (long names, missing data)

4. **Week 4: Deployment**
   - Deploy to staging environment
   - Production deployment with rollback plan

## Testing Template Integration

### Unit Tests for Template Loader

```javascript
import { loadTemplate, renderTemplate, generateEmail } from './emailTemplateLoader.js';

describe('Email Template Loader', () => {
  
  test('loadTemplate should load HTML file', () => {
    const template = loadTemplate('applicationSubmitted.html');
    expect(template).toContain('{{name}}');
    expect(template).toContain('<!DOCTYPE html>');
  });
  
  test('renderTemplate should replace placeholders', () => {
    const template = 'Hello {{name}}, your ref is {{ref}}';
    const rendered = renderTemplate(template, {
      name: 'John',
      ref: 'APP-001'
    });
    expect(rendered).toBe('Hello John, your ref is APP-001');
  });
  
  test('generateEmail should load and render', () => {
    const email = generateEmail('applicationSubmitted.html', {
      name: 'Jane Doe',
      applicationRef: 'APP-2026-0001',
      submissionDate: '6 Feb 2026',
      dashboardUrl: 'https://app.example.com'
    });
    expect(email).toContain('Jane Doe');
    expect(email).toContain('APP-2026-0001');
    expect(email).not.toContain('{{');
  });
});
```

### Integration Tests

```javascript
import { sendApplicationSubmittedEmail } from './emailNotifications.js';

describe('Email Notifications', () => {
  
  test('sendApplicationSubmittedEmail should send with correct template', async () => {
    const result = await sendApplicationSubmittedEmail('test@example.com', {
      name: 'Test User',
      applicationRef: 'APP-TEST-001',
      submissionDate: '6 Feb 2026',
      dashboardUrl: 'https://test.app'
    });
    
    expect(result.to).toBe('test@example.com');
    expect(result.template).toBe('applicationSubmitted');
    expect(result.html).toContain('Test User');
    expect(result.html).toContain('<html'); // Valid HTML
  });
});
```

## Template Validation Checklist

Before deploying templates, verify:

### ✅ HTML Structure
- [ ] Valid HTML5 (no unclosed tags)
- [ ] Proper DOCTYPE declaration
- [ ] Meta charset and viewport tags present

### ✅ Responsiveness
- [ ] Mobile view tested (max-width: 600px)
- [ ] All images have `alt` attributes
- [ ] Font sizes readable on mobile
- [ ] CTA buttons clickable on mobile

### ✅ Variables
- [ ] All `{{placeholders}}` documented
- [ ] No typos in placeholder names (case-sensitive)
- [ ] Matches function parameters in emailNotifications.js

### ✅ Branding
- [ ] Colors match brand guidelines
- [ ] Logo included and properly sized
- [ ] Footer information up-to-date
- [ ] Contact information correct

### ✅ Accessibility
- [ ] Color contrast ratio 4.5:1 or higher
- [ ] No information conveyed by color alone
- [ ] Alt text for all images
- [ ] Semantic HTML structure

### ✅ Compatibility
- [ ] Tested in Gmail
- [ ] Tested in Outlook
- [ ] Tested in Apple Mail
- [ ] Tested on mobile email clients
- [ ] No external font dependencies

## Performance Optimization

### File Size Targets
- Individual template: < 50KB (ideally < 30KB)
- All templates: < 250KB total

### Optimization Techniques
- Use minified CSS
- Compress images (if embedded)
- Remove unnecessary whitespace
- Use CSS shorthand properties

### Current Sizes
```
applicationSubmitted.html: ~18KB
applicationApproved.html: ~19KB
applicationRejected.html: ~17KB
deliveryScheduled.html: ~21KB
paymentRequired.html: ~22KB
────────────────────────
Total: ~97KB
```

All templates meet performance targets ✅

## Troubleshooting

### Problem: Template not found
**Solution:** Verify file exists in `src/email-templates/` and filename matches exactly (case-sensitive)

### Problem: Placeholders not replaced
**Solution:** Check placeholder syntax is exactly `{{variableName}}` with double curly braces

### Problem: Email renders incorrectly in client
**Solution:** Some email clients strip CSS. Test with email client testing service (Litmus) and add fallback inline styles

### Problem: Images not showing
**Solution:** Use absolute URLs (https://) instead of relative paths. Consider embedding images as base64 for critical images

## Rollback Plan

If issues occur after template integration:

1. **Immediate:** Revert to inline templates (Option 2 approach)
2. **Analysis:** Identify the specific template or variable causing issues
3. **Fix:** Update the problematic template file
4. **Re-test:** Verify fix with unit and integration tests
5. **Redeploy:** Roll out corrected template

## Next Steps

1. Choose integration approach (File-Based recommended)
2. Create `emailTemplateLoader.js` utility
3. Update `TransactionalEmailService.js` and `emailNotifications.js`
4. Write and run integration tests
5. Deploy to staging environment for testing
6. Deploy to production with monitoring

---

**Status:** Ready for Integration
**Template Files:** 5/5 Complete (applicationSubmitted, applicationApproved, applicationRejected, deliveryScheduled, paymentRequired)
**Testing Framework:** Jest recommended
**Deployment Target:** Production with staged rollout

