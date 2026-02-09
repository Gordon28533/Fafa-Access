/**
 * Email Audit Log Viewer
 * CLI utility for viewing and querying email logs
 * 
 * Usage:
 *   node view-email-logs.js --app APP-2024-0001
 *   node view-email-logs.js --template applicationSubmitted
 *   node view-email-logs.js --recipient student@example.com
 *   node view-email-logs.js --failed
 *   node view-email-logs.js --stats
 */

import process from 'process';
import { 
  getEmailLogsByReference,
  getEmailLogsByTemplate,
  getEmailLogsByRecipient,
  getFailedEmails,
  getEmailStatistics,
  getEmailLogSummary,
  exportEmailLogsToCSV
} from './src/services/emailLogging.js';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    options[args[i].substring(2)] = args[i + 1] || true;
  }
}

/**
 * Print formatted table
 */
function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log('  (No records found)');
    return;
  }

  const columnWidths = {};
  columns.forEach(col => {
    columnWidths[col] = Math.max(col.length, 15);
  });

  // Print header
  const header = columns.map(col => col.padEnd(columnWidths[col])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  // Print rows
  data.forEach(row => {
    const values = columns.map(col => String(row[col] || 'N/A').padEnd(columnWidths[col]));
    console.log(values.join(' | '));
  });

  console.log('');
}

/**
 * View logs by application reference
 */
async function viewByReference() {
  const appRef = options.app || options.ref;
  if (!appRef) {
    console.error('❌ Application reference required: --app APP-2024-0001');
    process.exit(1);
  }

  console.log(`\n📧 Email Logs for Application: ${appRef}\n`);

  const logs = await getEmailLogsByReference(appRef, { limit: 100 });
  
  if (logs.length === 0) {
    console.log('  No emails found for this application');
    return;
  }

  printTable(
    logs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Action: log.action,
      Recipient: JSON.parse(log.details || '{}').recipient || 'N/A',
      Template: JSON.parse(log.details || '{}').template || 'N/A',
      Status: JSON.parse(log.details || '{}').status || 'N/A',
    })),
    ['Timestamp', 'Action', 'Recipient', 'Template', 'Status']
  );
}

/**
 * View logs by template
 */
async function viewByTemplate() {
  const template = options.template;
  if (!template) {
    console.error('❌ Template name required: --template applicationSubmitted');
    process.exit(1);
  }

  console.log(`\n📧 Email Logs for Template: ${template}\n`);

  const logs = await getEmailLogsByTemplate(template, { limit: 100 });

  if (logs.length === 0) {
    console.log('  No emails found for this template');
    return;
  }

  printTable(
    logs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Recipient: JSON.parse(log.details || '{}').recipient || 'N/A',
      Status: JSON.parse(log.details || '{}').status || 'N/A',
      MessageID: JSON.parse(log.details || '{}').messageId || 'N/A',
    })),
    ['Timestamp', 'Recipient', 'Status', 'MessageID']
  );
}

/**
 * View logs by recipient
 */
async function viewByRecipient() {
  const recipient = options.recipient;
  if (!recipient) {
    console.error('❌ Email address required: --recipient student@example.com');
    process.exit(1);
  }

  console.log(`\n📧 Email Logs for Recipient: ${recipient}\n`);

  const logs = await getEmailLogsByRecipient(recipient, { limit: 100 });

  if (logs.length === 0) {
    console.log('  No emails found for this recipient');
    return;
  }

  printTable(
    logs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Template: JSON.parse(log.details || '{}').template || 'N/A',
      Status: JSON.parse(log.details || '{}').status || 'N/A',
      AppRef: JSON.parse(log.details || '{}').applicationRef || 'N/A',
    })),
    ['Timestamp', 'Template', 'Status', 'AppRef']
  );
}

/**
 * View failed emails
 */
async function viewFailed() {
  console.log('\n📧 Failed Email Logs\n');

  const logs = await getFailedEmails({ limit: 100 });

  if (logs.length === 0) {
    console.log('  ✅ No failed emails! All sends were successful.\n');
    return;
  }

  printTable(
    logs.map(log => ({
      Timestamp: new Date(log.sentAt).toLocaleString(),
      Recipient: log.message || 'N/A',
      Template: log.eventName || 'N/A',
      Status: log.status,
    })),
    ['Timestamp', 'Recipient', 'Template', 'Status']
  );
}

/**
 * View email statistics
 */
async function viewStats() {
  console.log('\n📊 Email Send Statistics\n');

  const stats = await getEmailStatistics();

  console.log(`Total Emails Sent:    ${stats.total}`);
  console.log(`Success:              ${stats.byStatus.success}`);
  console.log(`Failed:               ${stats.byStatus.failed}`);
  console.log(`Queued:               ${stats.byStatus.queued}`);
  console.log(`Success Rate:         ${stats.successRate}%\n`);

  console.log('📧 By Template:\n');
  Object.entries(stats.byTemplate).forEach(([template, count]) => {
    console.log(`  ${template.padEnd(30)} ${count} emails`);
  });

  console.log('');
}

/**
 * View summary report
 */
async function viewSummary() {
  console.log('\n📋 Email Activity Summary (Last 7 Days)\n');

  const summary = await getEmailLogSummary();

  console.log(`Period:               ${summary.period.start.split('T')[0]} to ${summary.period.end.split('T')[0]}`);
  console.log(`Total Emails:         ${summary.totalEmails}`);
  console.log(`Unique Recipients:    ${summary.uniqueRecipients}\n`);

  console.log('📧 By Template:\n');
  Object.entries(summary.byTemplate).forEach(([template, count]) => {
    console.log(`  ${template.padEnd(30)} ${count} emails`);
  });

  console.log('\n📊 By Status:\n');
  console.log(`  Success:             ${summary.byStatus.success} emails`);
  console.log(`  Failed:              ${summary.byStatus.failed} emails`);
  console.log('');
}

/**
 * Export to CSV
 */
async function exportToCSV() {
  const appRef = options.export;
  console.log('\n💾 Exporting email logs to CSV...\n');

  let logs;
  if (appRef && appRef !== true) {
    logs = await getEmailLogsByReference(appRef, { limit: 1000 });
  } else {
    logs = await getFailedEmails({ limit: 1000 });
  }

  const csv = exportEmailLogsToCSV(logs);
  const filename = `email-logs-${Date.now()}.csv`;
  
  // In real usage, write to file
  console.log(`  📁 Would export ${logs.length} records to ${filename}`);
  console.log(`  🔍 Sample:\n`);
  console.log(csv.split('\n').slice(0, 5).join('\n'));
  console.log('  ...\n');
}

/**
 * Print help
 */
function printHelp() {
  console.log(`
📧 Email Audit Log Viewer

Usage:
  node view-email-logs.js [options]

Options:
  --app <ref>              View logs for application (e.g., APP-2024-0001)
  --ref <ref>              Alias for --app
  --template <name>        View logs for template (e.g., applicationSubmitted)
  --recipient <email>      View logs for recipient email
  --failed                 View all failed email sends
  --stats                  View email statistics
  --summary                View 7-day summary report
  --export [app-ref]       Export to CSV (optionally filtered by app ref)
  --help                   Show this help message

Examples:
  node view-email-logs.js --app APP-2024-0001
  node view-email-logs.js --template applicationSubmitted
  node view-email-logs.js --recipient student@example.com
  node view-email-logs.js --failed
  node view-email-logs.js --stats
  node view-email-logs.js --summary
  node view-email-logs.js --export APP-2024-0001
  `);
}

/**
 * Main execution
 */
async function main() {
  try {
    if (options.help) {
      printHelp();
      process.exit(0);
    }

    if (options.app || options.ref) {
      await viewByReference();
    } else if (options.template) {
      await viewByTemplate();
    } else if (options.recipient) {
      await viewByRecipient();
    } else if (options.failed) {
      await viewFailed();
    } else if (options.stats) {
      await viewStats();
    } else if (options.summary) {
      await viewSummary();
    } else if (options.export) {
      await exportToCSV();
    } else {
      console.log('\n⚠️  No options specified. Use --help for usage information.\n');
      printHelp();
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

// Run main
main();
