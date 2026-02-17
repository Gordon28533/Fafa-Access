// srcNotificationTriggers.js
// SRC notification triggers routed through the event-driven NotificationService with dedupe protection
import NotificationService from './NotificationService';

const DEDUPE_TTL_MS = 5 * 60 * 1000;

const buildDedupeKey = ({ type, studentName, applicationRef }) => `${type}|${studentName}|${applicationRef}`;

export function notifySRCNewApplication({ studentName, applicationRef, submissionDate }) {
  const type = 'src.newApplication';
  return NotificationService.publishEvent(type, { studentName, applicationRef, submissionDate }, {
    dedupeKey: buildDedupeKey({ type, studentName, applicationRef }),
    dedupeTtlMs: DEDUPE_TTL_MS,
  });
}

export function notifySRCAdminFlag({ studentName, applicationRef, submissionDate }) {
  const type = 'src.adminFlag';
  return NotificationService.publishEvent(type, { studentName, applicationRef, submissionDate }, {
    dedupeKey: buildDedupeKey({ type, studentName, applicationRef }),
    dedupeTtlMs: DEDUPE_TTL_MS,
  });
}

export function notifySRCEscalatedOrDelayed({ studentName, applicationRef, submissionDate, reason }) {
  const type = 'src.escalated';
  return NotificationService.publishEvent(type, { studentName, applicationRef, submissionDate, reason }, {
    dedupeKey: buildDedupeKey({ type, studentName, applicationRef }),
    dedupeTtlMs: DEDUPE_TTL_MS,
  });
}
