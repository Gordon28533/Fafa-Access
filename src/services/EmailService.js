// EmailService.js
// Email delivery with HTML + plain-text fallback and pluggable providers (SMTP or transactional)

import { EventEmitter } from 'events';

class EmailProvider {
  async send() {
    throw new Error('send() not implemented');
  }
  parseStatusCallback() {
    // Normalize provider webhooks to { messageId, status, raw }
    return null;
  }
}

class SmtpProvider extends EmailProvider {
  constructor({ host, port = 587, secure = false, user, pass, from }) {
    super();
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.user = user;
    this.pass = pass;
    this.from = from;
  }

  async send({ to, subject, html, text, from }) {
    // Attempt to use nodemailer if available; otherwise log and simulate success.
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch (_e) {
      console.warn('[EmailService] nodemailer not installed; simulating email send');
    }

    if (nodemailer?.createTransport) {
      const transport = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: this.user && this.pass ? { user: this.user, pass: this.pass } : undefined,
      });
      const info = await transport.sendMail({
        from: from || this.from,
        to,
        subject,
        html,
        text,
      });
      return { messageId: info?.messageId || info?.response || `smtp-${Date.now()}`, provider: 'smtp', raw: info };
    }

    console.log(`[SMTP-SIM] To: ${to} | Subject: ${subject}`);
    return { messageId: `smtp-sim-${Date.now()}-${Math.random().toString(16).slice(2)}`, provider: 'smtp' };
  }
}

class SendGridProvider extends EmailProvider {
  constructor({ apiKey, from }) {
    super();
    this.apiKey = apiKey;
    this.from = from;
  }

  async send({ to, subject, html, text, from }) {
    const url = 'https://api.sendgrid.com/v3/mail/send';
    const body = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from || this.from },
      subject,
      content: [
        { type: 'text/plain', value: text || '' },
        { type: 'text/html', value: html || '' },
      ],
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const reason = await response.text();
      const err = new Error(`SendGrid send failed: ${reason}`);
      throw err;
    }
    return { messageId: `sg-${Date.now()}-${Math.random().toString(16).slice(2)}`, provider: 'sendgrid' };
  }
}

function stripHtml(html = '') {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultHtmlShell({ subject, body }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${subject || 'Notification'}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; padding: 16px; }
      .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
      .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
      .body { font-size: 14px; line-height: 1.6; white-space: pre-line; }
      .footer { margin-top: 16px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">${subject || 'Notification'}</div>
      <div class="body">${body || ''}</div>
      <div class="footer">This message was sent automatically. Do not reply.</div>
    </div>
  </body>
</html>`;
}

class EmailService extends EventEmitter {
  constructor({ providerName = 'smtp', providerConfig = {}, statusStore } = {}) {
    super();
    this.provider = this._initProvider(providerName, providerConfig);
    this.statusStore = statusStore;
  }

  _initProvider(name, config) {
    switch (name) {
      case 'sendgrid':
        return new SendGridProvider(config);
      case 'smtp':
      default:
        return new SmtpProvider(config);
    }
  }

  _recordStatus(entry) {
    if (this.statusStore) {
      this.statusStore({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    }
    this.emit('status', entry);
  }

  renderEmailEnvelope({ subject, body }) {
    const html = defaultHtmlShell({ subject, body });
    const text = stripHtml(body || html);
    return { subject, html, text };
  }

  async sendEmail({ to, subject, html, text, from }) {
    if (!to) throw new Error('to is required for email');
    const finalText = text || stripHtml(html);
    const result = await this.provider.send({ to, subject, html, text: finalText, from });
    const entry = { channel: 'email', status: 'sent', to, subject, messageId: result.messageId, provider: result.provider };
    this._recordStatus(entry);
    return { ...result, ...entry };
  }

  parseStatusCallback(payload) {
    const parsed = this.provider.parseStatusCallback(payload);
    if (parsed) this._recordStatus(parsed);
    return parsed;
  }
}

export default EmailService;
export { EmailProvider, SmtpProvider, SendGridProvider, defaultHtmlShell, stripHtml };
