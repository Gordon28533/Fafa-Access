// WhatsAppService.js
// WhatsApp Business API service with template sending, SMS fallback, and delivery status hooks

import { EventEmitter } from 'events';
import { renderChannelTemplate } from './notificationTemplates';

class WhatsAppProvider {
  async sendTemplate() {
    throw new Error('sendTemplate() not implemented');
  }
  parseStatusCallback() {
    return null;
  }
}

// Meta (WhatsApp Business Cloud API) provider adapter
class MetaBusinessProvider extends WhatsAppProvider {
  constructor({ accessToken, phoneNumberId, apiVersion = 'v19.0' }) {
    super();
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
  }

  async sendTemplate({ to, templateName, language = 'en', components }) {
    if (!to) throw new Error('Recipient phone (to) is required for WhatsApp');
    if (!templateName) throw new Error('templateName is required for WhatsApp template send');

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
      },
    };

    if (components?.length) {
      body.template.components = [
        {
          type: 'body',
          parameters: components.map((text) => ({ type: 'text', text: text ?? '' })),
        },
      ];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      const reason = data?.error?.message || response.statusText;
      const err = new Error(`WhatsApp send failed: ${reason}`);
      err.meta = data;
      throw err;
    }

    return {
      messageId: data?.messages?.[0]?.id || `wa-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      provider: 'meta',
      raw: data,
    };
  }

  parseStatusCallback(payload) {
    const status = payload?.statuses?.[0];
    if (!status) return null;
    return {
      messageId: status.id,
      status: status.status,
      channel: 'whatsapp',
      raw: payload,
      timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
    };
  }
}

const whatsappTemplateCatalog = {
  student: {
    applicationSubmitted: { name: 'student_application_submitted', language: 'en', placeholders: ['name', 'ref'] },
    srcApproved: { name: 'student_src_approved', language: 'en', placeholders: ['name', 'ref'] },
    srcRejected: { name: 'student_src_rejected', language: 'en', placeholders: ['name', 'ref', 'reason'] },
    adminApproved: { name: 'student_admin_approved', language: 'en', placeholders: ['name', 'ref'] },
    adminRejected: { name: 'student_admin_rejected', language: 'en', placeholders: ['name', 'ref', 'reason'] },
    deliveryAssigned: { name: 'student_delivery_assigned', language: 'en', placeholders: ['name', 'ref', 'date', 'agent'] },
    deliveryCompleted: { name: 'student_delivery_completed', language: 'en', placeholders: ['name', 'ref'] },
    paymentCollected: { name: 'student_payment_collected', language: 'en', placeholders: ['name', 'ref', 'amount'] },
  },
  src: {
    newApplication: { name: 'src_new_application', language: 'en', placeholders: ['ref'] },
    adminFlag: { name: 'src_admin_flag', language: 'en', placeholders: ['ref'] },
    escalated: { name: 'src_escalated', language: 'en', placeholders: ['ref', 'reason'] },
  },
  admin: {
    srcApproved: { name: 'admin_src_approved', language: 'en', placeholders: ['ref'] },
    srcRejected: { name: 'admin_src_rejected', language: 'en', placeholders: ['ref'] },
    adminRejected: { name: 'admin_rejected', language: 'en', placeholders: ['ref', 'reason'] },
    deliveryAssigned: { name: 'admin_delivery_assigned', language: 'en', placeholders: ['ref', 'agent'] },
    deliveryConfirmed: { name: 'admin_delivery_confirmed', language: 'en', placeholders: ['ref'] },
    paymentCollected: { name: 'admin_payment_collected', language: 'en', placeholders: ['ref', 'amount'] },
    payoutCompleted: { name: 'admin_payout_completed', language: 'en', placeholders: ['ref', 'amount', 'method'] },
  },
  delivery: {
    assigned: { name: 'delivery_assigned', language: 'en', placeholders: ['student', 'ref', 'date', 'location'] },
    reminder: { name: 'delivery_reminder', language: 'en', placeholders: ['ref', 'date', 'location'] },
    paymentCollection: { name: 'delivery_payment_collection', language: 'en', placeholders: ['ref', 'amount'] },
    confirmationPending: { name: 'delivery_confirmation_pending', language: 'en', placeholders: ['ref'] },
  },
};

class WhatsAppService extends EventEmitter {
  constructor({ providerName = 'meta', providerConfig = {}, smsFallbackService, statusStore } = {}) {
    super();
    this.provider = this._initProvider(providerName, providerConfig);
    this.smsFallback = smsFallbackService;
    this.statusStore = statusStore;
  }

  _initProvider(name, config) {
    switch (name) {
      case 'meta':
      default:
        return new MetaBusinessProvider(config);
    }
  }

  _templateFor(role, event) {
    return whatsappTemplateCatalog[role]?.[event];
  }

  _components(placeholders = [], vars = {}) {
    if (!placeholders.length) return undefined;
    return placeholders.map((key) => vars[key] ?? '');
  }

  _recordStatus(entry) {
    if (this.statusStore) {
      this.statusStore({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    }
    this.emit('status', entry);
  }

  async sendWithTemplate({ role, event, to, vars = {}, smsFallbackPayload }) {
    const templateConfig = this._templateFor(role, event);
    const templateName = templateConfig?.name;
    const language = templateConfig?.language || 'en';
    const whatsappBody = renderChannelTemplate({ role, event, channel: 'whatsapp', vars }) || '';

    try {
      const result = await this.provider.sendTemplate({
        to,
        templateName,
        language,
        components: this._components(templateConfig?.placeholders, vars),
      });
      const record = { channel: 'whatsapp', status: 'sent', messageId: result.messageId, role, event, to };
      this._recordStatus(record);
      return { ...result, channel: 'whatsapp', status: 'sent', body: whatsappBody };
    } catch (err) {
      const errorMessage = err?.message || 'WhatsApp send failed';
      this._recordStatus({ channel: 'whatsapp', status: 'failed', error: errorMessage, role, event, to });
      if (this.smsFallback && smsFallbackPayload?.to && smsFallbackPayload?.message) {
        const smsResult = this.smsFallback.sendSms({ to: smsFallbackPayload.to, message: smsFallbackPayload.message });
        this._recordStatus({ channel: 'sms', status: 'fallback', fromChannel: 'whatsapp', to: smsFallbackPayload.to, messageId: smsResult?.messageId });
        return { channel: 'sms', status: 'fallback', fallbackFrom: 'whatsapp', body: smsFallbackPayload.message, messageId: smsResult?.messageId, error: errorMessage };
      }
      throw err;
    }
  }

  parseStatusCallback(payload) {
    const parsed = this.provider.parseStatusCallback(payload);
    if (parsed) this._recordStatus(parsed);
    return parsed;
  }
}

export default WhatsAppService;
export { WhatsAppProvider, MetaBusinessProvider, whatsappTemplateCatalog };
