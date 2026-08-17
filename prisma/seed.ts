import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleFeedback = [
  ['The application is very easy to use and the new dashboard looks great.', 'PRODUCT_UI', 'POSITIVE', 'LOW', 'Product experience', 'OTHER', '0.98'],
  ['The app takes almost 10 seconds to load after login.', 'PERFORMANCE', 'NEGATIVE', 'HIGH', 'Login load time', 'BUG_REPORT', '0.97'],
  ['I forgot my password and the reset email never arrived.', 'AUTHENTICATION', 'NEGATIVE', 'HIGH', 'Password reset email', 'BUG_REPORT', '0.99'],
  ['It would be really useful if we could export the reports as Excel files.', 'FEATURE_REQUEST', 'NEUTRAL', 'MEDIUM', 'Report export', 'FEATURE_REQUEST', '0.96'],
  ['The payment went through but my account still shows the invoice as unpaid.', 'PAYMENTS', 'NEGATIVE', 'HIGH', 'Payment reconciliation', 'BUG_REPORT', '0.98'],
  ['Your support team resolved my issue within a few minutes. Excellent service!', 'CUSTOMER_SUPPORT', 'POSITIVE', 'LOW', 'Fast resolution', 'OTHER', '0.97'],
  ['The mobile version crashes whenever I try to upload a document.', 'BUG_MOBILE', 'NEGATIVE', 'HIGH', 'Mobile document upload', 'BUG_REPORT', '0.99'],
  ['Can you add dark mode? Using the application at night is difficult.', 'UI_UX', 'NEUTRAL', 'LOW', 'Dark mode', 'FEATURE_REQUEST', '0.98'],
  ['The latest update is much faster than the previous version.', 'PERFORMANCE', 'POSITIVE', 'LOW', 'Improved response time', 'OTHER', '0.96'],
  ['I have been waiting for a response from support for three days.', 'CUSTOMER_SUPPORT', 'NEGATIVE', 'HIGH', 'Support response time', 'OTHER', '0.95'],
  ["The search feature is difficult to use because it doesn't return relevant results.", 'USABILITY', 'NEGATIVE', 'MEDIUM', 'Search relevance', 'BUG_REPORT', '0.96'],
  ['Please add an option to filter transactions by date and status.', 'FEATURE_REQUEST', 'NEUTRAL', 'MEDIUM', 'Transaction filters', 'FEATURE_REQUEST', '0.99'],
  ['Everything worked perfectly until yesterday, but now I cannot log in.', 'AUTHENTICATION', 'NEGATIVE', 'HIGH', 'Login failure', 'BUG_REPORT', '0.98'],
  ['The new notification system is really helpful.', 'PRODUCT_UI', 'POSITIVE', 'LOW', 'Notification experience', 'OTHER', '0.95'],
  ['I was charged twice for the same transaction.', 'PAYMENTS', 'NEGATIVE', 'CRITICAL', 'Duplicate charge', 'BUG_REPORT', '1.0'],
  ['The dashboard contains too much information and feels overwhelming.', 'USABILITY', 'NEGATIVE', 'MEDIUM', 'Dashboard information density', 'OTHER', '0.96'],
  ['It would be great to receive notifications when a payment is due.', 'FEATURE_REQUEST', 'NEUTRAL', 'MEDIUM', 'Payment due notifications', 'FEATURE_REQUEST', '0.98'],
  ['Thank you for fixing the issue so quickly. Everything is working now.', 'CUSTOMER_SUPPORT', 'POSITIVE', 'LOW', 'Issue resolution', 'OTHER', '0.97'],
  ['The application keeps logging me out every few minutes.', 'AUTHENTICATION', 'NEGATIVE', 'HIGH', 'Session expiration', 'BUG_REPORT', '0.99'],
  ['The reports are useful, but generating them takes too long.', 'PERFORMANCE', 'NEGATIVE', 'MEDIUM', 'Report generation time', 'BUG_REPORT', '0.97'],
  ['I love the new design. It feels much cleaner than before.', 'UI_UX', 'POSITIVE', 'LOW', 'Visual redesign', 'OTHER', '0.98'],
  ['Can multiple users work on the same account at the same time?', 'FEATURE_REQUEST', 'NEUTRAL', 'MEDIUM', 'Multi-user accounts', 'QUESTION', '0.94'],
  ["The error message doesn't explain what went wrong or how to fix it.", 'USABILITY', 'NEGATIVE', 'MEDIUM', 'Error message guidance', 'BUG_REPORT', '0.98'],
  ["Support was polite but unfortunately couldn't solve my problem.", 'CUSTOMER_SUPPORT', 'MIXED', 'MEDIUM', 'Unresolved support issue', 'OTHER', '0.91'],
  ['The latest release broke the report download functionality.', 'BUILD_FAILURE', 'NEGATIVE', 'CRITICAL', 'Report download regression', 'BUG_REPORT', '0.99'],
  ['I would recommend this application to my colleagues.', 'PRODUCT_UI', 'POSITIVE', 'LOW', 'Product advocacy', 'OTHER', '0.97'],
  ['The application is okay, but there are too many steps to complete a payment.', 'USABILITY', 'NEGATIVE', 'MEDIUM', 'Payment flow complexity', 'OTHER', '0.94'],
  ['Please provide an API so we can integrate this with our internal system.', 'INTEGRATION', 'NEUTRAL', 'MEDIUM', 'Public API', 'FEATURE_REQUEST', '0.99'],
  ['I received an incorrect notification saying that my payment was overdue.', 'NOTIFICATIONS', 'NEGATIVE', 'HIGH', 'Payment notification accuracy', 'BUG_REPORT', '0.97'],
  ['Great experience overall. The application is fast and the interface is intuitive.', 'PRODUCT_UI', 'POSITIVE', 'LOW', 'Overall product experience', 'OTHER', '0.98'],
  ['The page sometimes freezes when I open a large report.', 'PERFORMANCE', 'NEGATIVE', 'HIGH', 'Large report rendering', 'BUG_REPORT', '0.96'],
  ['Can I download my transaction history in CSV format?', 'FEATURE_REQUEST', 'NEUTRAL', 'LOW', 'Transaction export', 'QUESTION', '0.95'],
  ["I don't understand why my transaction was rejected. There is no useful explanation.", 'PAYMENTS', 'NEGATIVE', 'HIGH', 'Transaction rejection explanation', 'BUG_REPORT', '0.98'],
  ['The onboarding process was simple and straightforward.', 'ONBOARDING', 'POSITIVE', 'LOW', 'Onboarding experience', 'OTHER', '0.97'],
  ['I had to contact support three times before someone understood the issue.', 'CUSTOMER_SUPPORT', 'NEGATIVE', 'HIGH', 'First-contact resolution', 'OTHER', '0.96'],
  ['The application works well, but the font size is too small on my laptop.', 'UI_UX', 'NEGATIVE', 'LOW', 'Font size accessibility', 'OTHER', '0.98'],
  ['Please add two-factor authentication for better account security.', 'SECURITY', 'NEUTRAL', 'HIGH', 'Two-factor authentication', 'FEATURE_REQUEST', '0.99'],
  ["I haven't experienced any issues so far. Everything is working as expected.", 'GENERAL', 'POSITIVE', 'LOW', 'General satisfaction', 'OTHER', '0.95'],
  ['The system was unavailable for about 30 minutes this morning.', 'AVAILABILITY', 'NEGATIVE', 'CRITICAL', 'Service availability incident', 'BUG_REPORT', '0.99'],
  ['The new feature is useful, but it took me a while to figure out how to use it.', 'USABILITY', 'MIXED', 'MEDIUM', 'Feature discoverability', 'OTHER', '0.93'],
] as const;

async function main() {
  await prisma.feedbackSubmission.deleteMany({ where: { apiClient: 'sample-seed' } });

  for (const [index, [message, category, sentiment, severity, subcategory, intent, confidence]] of sampleFeedback.entries()) {
    const id = `fb_seed_${String(index + 1).padStart(2, '0')}`;
    const createdAt = new Date(Date.UTC(2026, 7, 1 + index));

    await prisma.feedbackSubmission.create({
      data: {
        id,
        message,
        source: 'sample-seed',
        apiClient: 'sample-seed',
        status: 'COMPLETED',
        createdAt,
        idempotencyKey: `sample-seed-${index + 1}`,
        userId: `user_seed_${String(index + 1).padStart(2, '0')}`,
        projectId: `project_seed_${((index % 5) + 1).toString().padStart(2, '0')}`,
        conversationId: `conversation_seed_${String(index + 1).padStart(2, '0')}`,
        metadata: { seed: true, sampleRow: index + 1, environment: 'development' },
        analysisRuns: {
          create: {
            sentiment,
            intent,
            category,
            subcategory,
            severity,
            summary: message,
            confidence: Number(confidence),
            model: 'sample-seed',
            promptVersion: 'seed-v1',
            createdAt,
          },
        },
      },
    });
  }

  console.log(`Seeded ${sampleFeedback.length} feedback submissions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
