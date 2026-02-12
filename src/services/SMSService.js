/* eslint-disable no-unused-vars */
// SMSService.js
// Provider-agnostic SMS service with queue, rate limiting, and delivery callbacks

import { EventEmitter } from 'events';
import crypto from 'crypto';

// ---- Provider Abstractions ----
class SmsProvider {
  async send() {
    throw new Error('send() not implemented');
  }
  parseStatusCallback() {
    // Should return { messageId, status: 'delivered'|'failed'|'queued'|'sent', raw }
    return null;
  }
}

// Example provider adapters (placeholders). Replace with real API integrations.
class TwilioProvider extends SmsProvider {
  constructor({ accountSid, authToken, from }) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.from = from;
  }
  async send({ to, senderId }) {
    // TODO: integrate Twilio REST API. Return { messageId, provider: 'twilio' }
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const msgId = `twilio-${Date.now()}-${randomBytes}`;
    return { messageId: msgId, provider: 'twilio', to, from: senderId || this.from };
  }
  parseStatusCallback(payload) {
    return {
      messageId: payload?.MessageSid,
      status: payload?.MessageStatus,
      raw: payload,
    };
  }
}

class HubtelProvider extends SmsProvider {
  constructor({ apiKey, clientId, from }) {
    super();
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.from = from;
  }
  async send({ to, senderId }) {
    // TODO: integrate Hubtel SMS API. Return { messageId, provider: 'hubtel' }
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const msgId = `hubtel-${Date.now()}-${randomBytes}`;
    return { messageId: msgId, provider: 'hubtel', to, from: senderId || this.from };
  }
  parseStatusCallback(payload) {
    return {
      messageId: payload?.MessageId || payload?.messageId,
      status: payload?.Status || payload?.status,
      raw: payload,
    };
  }
}

class AfricasTalkingProvider extends SmsProvider {
  constructor({ apiKey, username, from }) {
    super();
    this.apiKey = apiKey;
    this.username = username;
    this.from = from;
  }
  async send({ to, senderId }) {
    // TODO: integrate Africa's Talking SMS API. Return { messageId, provider: 'africastalking' }
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const msgId = `at-${Date.now()}-${randomBytes}`;
    return { messageId: msgId, provider: 'africastalking', to, from: senderId || this.from };
  }
  parseStatusCallback(payload) {
    return {
      messageId: payload?.id || payload?.messageId,
      status: payload?.status,
      raw: payload,
    };
  }
}

// ---- Rate Limiter (token bucket) ----
class TokenBucket {
  constructor({ capacity, refillRatePerSec }) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.lastRefill = Date.now();
  }
  take(count = 1) {
    this._refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refill = elapsed * this.refillRatePerSec;
    if (refill > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refill);
      this.lastRefill = now;
    }
  }
}

// ---- SMS Queue ----
class SmsQueue extends EventEmitter {
  constructor({ provider, rateLimiter, workerIntervalMs = 500 }) {
    super();
    this.provider = provider;
    this.rateLimiter = rateLimiter;
    this.workerIntervalMs = workerIntervalMs;
    this.queue = [];
    this.isWorking = false;
    this._startWorker();
  }

  enqueue(message) {
    this.queue.push(message);
    this.emit('queued', message);
  }

  _startWorker() {
    if (this.isWorking) return;
    this.isWorking = true;
    setInterval(async () => {
      if (!this.queue.length) return;
      const next = this.queue[0];
      if (!this.rateLimiter.take(1)) return; // wait for tokens
      try {
        const result = await this.provider.send(next);
        this.queue.shift();
        this.emit('sent', { ...next, ...result });
      } catch (err) {
        this.emit('error', { message: next, error: err });
        // simple retry with backoff: re-enqueue at end
        this.queue.shift();
        setTimeout(() => this.enqueue(next), 1000);
      }
    }, this.workerIntervalMs);
  }
}

// ---- SMS Service ----
class SMSService extends EventEmitter {
  constructor({ providerName = 'hubtel', providerConfig = {}, rateLimit = { capacity: 10, refillRatePerSec: 5 } }) {
    super();
    this.provider = this._initProvider(providerName, providerConfig);
    this.queue = new SmsQueue({
      provider: this.provider,
      rateLimiter: new TokenBucket(rateLimit),
    });
    this._bindQueueEvents();
  }

  _initProvider(name, config) {
    switch (name) {
      case 'twilio':
        return new TwilioProvider(config);
      case 'africastalking':
        return new AfricasTalkingProvider(config);
      case 'hubtel':
      default:
        return new HubtelProvider(config);
    }
  }

  _bindQueueEvents() {
    this.queue.on('queued', (msg) => this.emit('queued', msg));
    this.queue.on('sent', (msg) => this.emit('sent', msg));
    this.queue.on('error', (err) => this.emit('error', err));
  }

  sendSms({ to, message, senderId }) {
    if (!to || !message) throw new Error('to and message are required');
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const messageId = `sms-${Date.now()}-${randomBytes}`;
    const payload = { to, message, senderId, messageId };
    this.queue.enqueue(payload);
    return { enqueued: true, messageId };
  }

  handleStatusCallback(providerName, payload) {
    const provider = this._initProvider(providerName, {});
    const parsed = provider.parseStatusCallback(payload);
    if (parsed) {
      this.emit('status', parsed);
    }
    return parsed;
  }
}

export default SMSService;
export { SmsProvider, TwilioProvider, HubtelProvider, AfricasTalkingProvider };
