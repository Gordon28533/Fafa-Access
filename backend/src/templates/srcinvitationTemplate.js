/**
 * SRC Invitation Email Template
 * 
 * Sent to SRC officers when invited to manage a university
 * Includes:
 * - Personalized greeting
 * - University name
 * - Partnership agreement overview
 * - Secure invitation link
 * - Token expiry information
 * 
 * Template Key: 'srcInvitation'
 * Created: February 8, 2026
 */

const SRCInvitationTemplate = {
  subject: 'You are Invited as an SRC Officer - Accept Partnership Agreement',
  
  html: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { background: #f8f9fa; padding: 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; font-weight: 500; }
    .welcome-text { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .highlight { background: #fff9e6; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .highlight h3 { margin: 0 0 10px 0; color: #667eea; font-size: 16px; }
    .highlight p { margin: 5px 0; color: #666; font-size: 14px; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
    .token-link { background: #f0f0f0; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 12px; color: #666; margin-top: 10px; }
    .steps { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .steps h3 { margin: 0 0 15px 0; color: #667eea; font-size: 16px; }
    .steps ol { margin: 0; padding-left: 20px; color: #666; line-height: 1.8; }
    .steps li { margin-bottom: 10px; }
    .expiry-notice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #856404; }
    .agreement-preview { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
    .agreement-preview h4 { margin: 0 0 10px 0; color: #667eea; font-size: 14px; font-weight: 600; }
    .agreement-preview ul { margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.6; }
    .agreement-preview li { margin-bottom: 8px; }
    .footer { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .footer a { color: #fff; text-decoration: underline; }
    .divider { border-top: 1px solid #e0e0e0; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎓 SRC Officer Invitation</h1>
      <p>Partnership Agreement & Account Setup</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      <p class="greeting">Hello ${data.firstName},</p>

      <p class="welcome-text">
        You have been invited to serve as an <strong>SRC (Student Representative Council) Officer</strong> 
        for <strong>${data.universityName}</strong>. This is an important role that allows you to manage 
        student applications and ensure smooth operations for your university.
      </p>

      <!-- Partnership Agreement Overview -->
      <div class="highlight">
        <h3>📋 Partnership Agreement</h3>
        <p>
          Before we can activate your account, you must review and accept our 
          <strong>SRC Partnership Agreement</strong>. This agreement outlines:
        </p>
      </div>

      <div class="agreement-preview">
        <h4>What You'll Agree To:</h4>
        <ul>
          <li>Confidentiality of student data and university information</li>
          <li>Responsible management of application reviews and decisions</li>
          <li>Adherence to data protection and privacy regulations</li>
          <li>Professional conduct and ethical standards</li>
          <li>Regular communication and reporting requirements</li>
          <li>Account security and password management best practices</li>
        </ul>
      </div>

      <!-- Steps to Get Started -->
      <div class="steps">
        <h3>✅ How to Get Started</h3>
        <ol>
          <li>Click the <strong>"Accept Agreement"</strong> button below</li>
          <li>Review the complete partnership agreement in detail</li>
          <li>Click <strong>"I Accept"</strong> to confirm</li>
          <li>Wait for an admin to verify and contact you within 24 hours</li>
          <li>Complete final account setup when admin reaches out</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div class="cta-section">
        <a href="${data.inviteLink}" class="cta-button">
          ➜ View Invitation & Accept Agreement
        </a>
      </div>

      <!-- Expiry Notice -->
      <div class="expiry-notice">
        ⏱️ <strong>Important:</strong> This invitation expires in <strong>${data.expiryDays} days</strong>. 
        Please accept it soon to avoid needing a new invitation.
      </div>

      <!-- Direct Link (if button doesn't work) -->
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        If the button above doesn't work, copy and paste this link in your browser:
      </p>
      <div class="token-link">${data.inviteLink}</div>

      <div class="divider"></div>

      <!-- Security & Contact -->
      <p style="color: #999; font-size: 13px; margin: 20px 0; text-align: center;">
        <strong>Didn't receive this invitation?</strong> Contact your admin. <br>
        <strong>Questions about the partnership?</strong> Reply to this email or contact support.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>This is an automated message from the Laptop Application System</strong></p>
      <p>Please do not reply directly to this email. Contact your administrator for assistance.</p>
      <p>
        <a href="https://example.com/privacy">Privacy Policy</a> | 
        <a href="https://example.com/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `,

  text: (data) => `
SRC OFFICER INVITATION

Hello ${data.firstName},

You have been invited to serve as an SRC (Student Representative Council) Officer for ${data.universityName}.

IMPORTANT: PARTNERSHIP AGREEMENT
Before we can activate your account, you must review and accept our SRC Partnership Agreement.

You will agree to:
- Confidentiality of student data and university information
- Responsible management of application reviews and decisions
- Adherence to data protection and privacy regulations
- Professional conduct and ethical standards
- Regular communication and reporting requirements
- Account security and password management best practices

HOW TO GET STARTED:
1. Click the link below or copy-paste into your browser
2. Review the complete partnership agreement
3. Click "I Accept" to confirm
4. Wait for admin to verify and contact you within 24 hours
5. Complete final account setup

ACCEPT INVITATION:
${data.inviteLink}

EXPIRY: This invitation expires in ${data.expiryDays} days. Please accept soon.

If the link doesn't work, copy and paste this exact text into your browser:
${data.inviteLink}

Questions? Contact your administrator.

---
This is an automated message from the Laptop Application System.
Do not reply to this email. Contact support for assistance.
  `,
};

export default SRCInvitationTemplate;
