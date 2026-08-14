import { processPendingAnalysisJobs } from '@/services/feedback-ingestion.service';

const intervalMs = Number(process.env.ANALYSIS_WORKER_INTERVAL_MS ?? 5_000);
const batchSize = Number(process.env.ANALYSIS_WORKER_BATCH_SIZE ?? 10);

async function run() {
  const processed = await processPendingAnalysisJobs('analysis-worker', batchSize);
  if (processed > 0) console.info(JSON.stringify({ event: 'analysis_worker_batch_completed', processed }));
}

async function main() {
  await run();
  setInterval(() => void run().catch((error) => console.error(JSON.stringify({ event: 'analysis_worker_failed', error: String(error) }))), intervalMs);
}

void main();
