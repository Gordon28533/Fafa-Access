// notificationTemplates.js
// Reusable notification templates with channel-aware variants (SMS, WhatsApp, Email)

// Lightweight template renderer for {{placeholder}} replacements
const render = (template, vars = {}) =>
  template.replace(/{{(\w+)}}/g, (_, key) => (vars[key] ?? ''));

// Channel-aware templates grouped by role and event
export const channelTemplates = {
  student: {
    applicationSubmitted: {
      sms: 'We received your laptop application (Ref: {{ref}}). We will update you after SRC review.',
      whatsapp: 'Hello {{name}}, your laptop application (Ref: {{ref}}) is submitted. SRC review is next. Thank you.',
      email: {
        subject: 'Application Received (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nWe have received your laptop application (Ref: {{ref}}). The SRC will review and we will keep you updated.\n\nThank you.',
      },
    },
    srcApproved: {
      sms: 'Good news! SRC approved your application (Ref: {{ref}}). Awaiting admin review.',
      whatsapp: 'Hello {{name}}, SRC approved your laptop application (Ref: {{ref}}). Next: admin review.',
      email: {
        subject: 'SRC Approval (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nYour laptop application (Ref: {{ref}}) has been approved by the SRC. It now moves to admin review.\n\nBest regards.',
      },
    },
    srcRejected: {
      sms: 'Update: SRC could not approve your application (Ref: {{ref}}). Reason: {{reason}}.',
      whatsapp: 'Hello {{name}}, SRC did not approve your application (Ref: {{ref}}). Reason: {{reason}}. Contact SRC for help.',
      email: {
        subject: 'SRC Decision (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nThe SRC could not approve your laptop application (Ref: {{ref}}). Reason: {{reason}}. If you need assistance, please contact the SRC office.\n\nThank you.',
      },
    },
    adminApproved: {
      sms: 'Your application (Ref: {{ref}}) is fully approved. We will schedule delivery shortly.',
      whatsapp: 'Hello {{name}}, admin approved your application (Ref: {{ref}}). Delivery scheduling is next.',
      email: {
        subject: 'Admin Approval Confirmed (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nYour laptop application (Ref: {{ref}}) has been approved by the Admin. We will contact you to arrange delivery.\n\nBest regards.',
      },
    },
    adminRejected: {
      sms: 'Admin could not approve your application (Ref: {{ref}}). Reason: {{reason}}.',
      whatsapp: 'Hello {{name}}, admin did not approve your application (Ref: {{ref}}). Reason: {{reason}}.',
      email: {
        subject: 'Admin Decision (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nThe Admin could not approve your laptop application (Ref: {{ref}}). Reason: {{reason}}. For questions, please contact the Admin office.\n\nThank you.',
      },
    },
    deliveryAssigned: {
      sms: 'Delivery set for your laptop (Ref: {{ref}}) on {{date}} with {{agent}}. Please be available.',
      whatsapp: 'Hello {{name}}, delivery for Ref: {{ref}} is scheduled on {{date}}. Agent: {{agent}}. Please be available.',
      email: {
        subject: 'Delivery Scheduled (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nYour laptop (Ref: {{ref}}) is scheduled for delivery on {{date}}. Delivery Agent: {{agent}}. Kindly ensure availability.\n\nThank you.',
      },
    },
    deliveryCompleted: {
      sms: 'Delivery completed for your laptop (Ref: {{ref}}). Thank you.',
      whatsapp: 'Hello {{name}}, your laptop delivery (Ref: {{ref}}) is complete. Thank you.',
      email: {
        subject: 'Delivery Confirmation (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nWe confirm your laptop delivery (Ref: {{ref}}) is complete. If you need assistance, please reach out.\n\nBest regards.',
      },
    },
    paymentCollected: {
      sms: 'Payment received GHS {{amount}} for your laptop (Ref: {{ref}}). Thank you.',
      whatsapp: 'Hello {{name}}, we received GHS {{amount}} for your laptop (Ref: {{ref}}). Thank you.',
      email: {
        subject: 'Payment Received (Ref: {{ref}})',
        body: 'Dear {{name}},\n\nWe acknowledge receipt of GHS {{amount}} for your laptop (Ref: {{ref}}). Thank you for your prompt payment.\n\nBest regards.',
      },
    },
  },
  src: {
    newApplication: {
      sms: 'New student application (Ref: {{ref}}) awaiting SRC review.',
      whatsapp: 'New application received. Ref: {{ref}}. Please review.',
      email: {
        subject: 'New Application Pending SRC Review (Ref: {{ref}})',
        body: 'An application (Ref: {{ref}}) awaits SRC review. Please log in to review and decide.\n\nThank you.',
      },
    },
    adminFlag: {
      sms: 'Flagged: Application (Ref: {{ref}}) needs SRC attention.',
      whatsapp: 'Admin flagged application (Ref: {{ref}}) for urgent SRC review.',
      email: {
        subject: 'Flagged Application – Action Needed (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) was flagged for SRC attention. Please review promptly.\n\nThank you.',
      },
    },
    escalated: {
      sms: 'Escalation: Application (Ref: {{ref}}) delayed. Reason: {{reason}}.',
      whatsapp: 'Application (Ref: {{ref}}) escalated/delayed. Reason: {{reason}}. Please review.',
      email: {
        subject: 'Escalation/Delay Notice (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) is escalated/delayed. Reason: {{reason}}. Please take action.\n\nThank you.',
      },
    },
  },
  admin: {
    srcApproved: {
      sms: 'SRC approved application (Ref: {{ref}}). Pending your review.',
      whatsapp: 'SRC approved application (Ref: {{ref}}). Please review.',
      email: {
        subject: 'SRC Approval – Review Needed (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) was approved by SRC. Please proceed with admin review.\n\nThank you.',
      },
    },
    srcRejected: {
      sms: 'SRC rejected application (Ref: {{ref}}). No action required.',
      whatsapp: 'SRC rejected application (Ref: {{ref}}). Noted.',
      email: {
        subject: 'SRC Rejection Logged (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) was rejected by SRC. No further action is required.\n\nThank you.',
      },
    },
    adminRejected: {
      sms: 'You rejected application (Ref: {{ref}}). Reason: {{reason}}.',
      whatsapp: 'Application (Ref: {{ref}}) marked rejected. Reason: {{reason}}.',
      email: {
        subject: 'Admin Rejection Recorded (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) has been rejected. Reason: {{reason}}. The decision is logged.\n\nThank you.',
      },
    },
    deliveryAssigned: {
      sms: 'Delivery assigned for application (Ref: {{ref}}) to {{agent}}.',
      whatsapp: 'Delivery for (Ref: {{ref}}) assigned to {{agent}}. Tracking in progress.',
      email: {
        subject: 'Delivery Assigned (Ref: {{ref}})',
        body: 'Delivery for application (Ref: {{ref}}) is assigned to {{agent}}. Please monitor delivery and payment collection.\n\nThank you.',
      },
    },
    deliveryConfirmed: {
      sms: 'Delivery confirmed for application (Ref: {{ref}}).',
      whatsapp: 'Delivery completed for (Ref: {{ref}}).',
      email: {
        subject: 'Delivery Confirmed (Ref: {{ref}})',
        body: 'Application (Ref: {{ref}}) delivery is confirmed. Please verify payment collection status.\n\nThank you.',
      },
    },
    paymentCollected: {
      sms: '70% payment received for (Ref: {{ref}}). Amount: GHS {{amount}}.',
      whatsapp: 'Payment received for (Ref: {{ref}}): GHS {{amount}}. Proceed to payout.',
      email: {
        subject: 'Payment Collected (Ref: {{ref}})',
        body: '70% payment collected for application (Ref: {{ref}}). Amount: GHS {{amount}}. Please proceed with payout to SRC.\n\nThank you.',
      },
    },
    payoutCompleted: {
      sms: 'SRC payout completed (Ref: {{ref}}). Amount: GHS {{amount}}.',
      whatsapp: 'Payout done for (Ref: {{ref}}). Amount: GHS {{amount}}. Method: {{method}}.',
      email: {
        subject: 'Payout Completed (Ref: {{ref}})',
        body: 'Payout completed for application (Ref: {{ref}}). Amount: GHS {{amount}}. Method: {{method}}. Payment reference recorded.\n\nThank you.',
      },
    },
  },
  delivery: {
    assigned: {
      sms: 'New delivery assigned. Student: {{student}}. Ref: {{ref}}. Date: {{date}}. Location: {{location}}.',
      whatsapp: 'Delivery assigned. Student: {{student}}. Ref: {{ref}}. Date: {{date}}. Location: {{location}}. Collect 70% on delivery.',
      email: {
        subject: 'Delivery Assignment (Ref: {{ref}})',
        body: 'You are assigned a delivery. Student: {{student}}. Ref: {{ref}}. Date: {{date}}. Location: {{location}}. Collect 70% on delivery.\n\nThank you.',
      },
    },
    reminder: {
      sms: 'Reminder: Delivery tomorrow. Ref: {{ref}}. Location: {{location}}. Collect 70%.',
      whatsapp: 'Reminder: Delivery scheduled. Ref: {{ref}}. Date: {{date}}. Location: {{location}}. Collect 70%.',
      email: {
        subject: 'Delivery Reminder (Ref: {{ref}})',
        body: 'Reminder for delivery. Ref: {{ref}}. Date: {{date}}. Location: {{location}}. Please collect 70% payment.\n\nThank you.',
      },
    },
    paymentCollection: {
      sms: 'Collect 70% for Ref: {{ref}} on delivery. Amount: GHS {{amount}}.',
      whatsapp: 'Please collect 70% (GHS {{amount}}) for Ref: {{ref}} at delivery.',
      email: {
        subject: 'Payment Collection Required (Ref: {{ref}})',
        body: 'Collect 70% (GHS {{amount}}) for application Ref: {{ref}} during delivery. Ensure receipt is recorded.\n\nThank you.',
      },
    },
    confirmationPending: {
      sms: 'Confirm delivery status for Ref: {{ref}} in the system.',
      whatsapp: 'Please update delivery confirmation for Ref: {{ref}}. Status pending.',
      email: {
        subject: 'Delivery Confirmation Pending (Ref: {{ref}})',
        body: 'Delivery status for Ref: {{ref}} is pending confirmation. Please update the system with delivery and payment details.\n\nThank you.',
      },
    },
  },
};

// Helpers to render per channel
export function renderChannelTemplate({ role, event, channel, vars }) {
  const roleTemplates = channelTemplates[role];
  if (!roleTemplates) return '';
  const eventTemplates = roleTemplates[event];
  if (!eventTemplates) return '';
  if (channel === 'email') {
    const subject = render(eventTemplates.email.subject, vars);
    const body = render(eventTemplates.email.body, vars);
    return { subject, body };
  }
  const template = eventTemplates[channel];
  return template ? render(template, vars) : '';
}

// Backward-compatible simple templates (used by legacy callers)
const notificationTemplates = {
  applicationSubmitted: ({ studentName, university, applicationRef }) =>
    `Dear ${studentName},\n\nYour laptop application (Ref: ${applicationRef}) to ${university} has been received. The SRC will review your submission and keep you informed.\n\nThank you for your interest.`,

  srcApproved: ({ studentName, university, applicationRef }) =>
    `Dear ${studentName},\n\nWe are pleased to inform you that your laptop application (Ref: ${applicationRef}) to ${university} has been approved by the SRC. It will now proceed to the Admin for further review.\n\nBest regards,\nSRC`,

  adminApproved: ({ studentName, university, applicationRef }) =>
    `Dear ${studentName},\n\nCongratulations! Your laptop application (Ref: ${applicationRef}) to ${university} has received final approval from the Admin. We will contact you soon regarding delivery arrangements.\n\nBest wishes,\nAdmin Office`,

  deliveryAssigned: ({ studentName, university, applicationRef, deliveryDate }) =>
    `Dear ${studentName},\n\nYour laptop (Ref: ${applicationRef}) for ${university} is scheduled for delivery on ${deliveryDate}. Please ensure you are available to receive it.\n\nThank you for your cooperation.`,

  deliveryCompleted: ({ studentName, university, applicationRef }) =>
    `Dear ${studentName},\n\nWe are pleased to confirm that your laptop (Ref: ${applicationRef}) for ${university} has been successfully delivered. Should you require any assistance, kindly contact the SRC or Admin office.\n\nThank you.`,

  paymentCollected: ({ studentName, university, applicationRef, amount }) =>
    `Dear ${studentName},\n\nWe acknowledge receipt of your payment of GHS ${amount} for your laptop (Ref: ${applicationRef}) at ${university}. Thank you for your prompt payment.\n\nBest regards,\nFinance Office`,
};

export default notificationTemplates;
