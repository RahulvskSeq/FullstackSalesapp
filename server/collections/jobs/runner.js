import ColJob from '../models/Job.js';
/**
 * A single in-process worker. Enough for one server; the interface is what
 * matters — enqueue / register / start — so a queue can replace it later
 * without touching callers.
 *
 * A job that dies mid-way (process restart) leaves RUNNING with a stale
 * heartbeat; on start it is re-queued. Handlers are written to be resumable.
 */
const handlers = new Map();
let running = false, timer = null;
const POLL_MS = 1500, HEARTBEAT_MS = 5000, STALE_MS = 120_000;

export function register(type, fn) { handlers.set(type, fn); }
export async function enqueue(type, payload = {}, { by = '' } = {}) {
  if (!handlers.has(type)) throw new Error('No handler registered for job type ' + type);
  return ColJob.create({ type, payload, by });
}

async function runOne() {
  const job = await ColJob.findOneAndUpdate(
    { status: 'QUEUED', type: { $in: [...handlers.keys()] } },
    { $set: { status: 'RUNNING', startedAt: new Date(), heartbeatAt: new Date() }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true });
  if (!job) return false;
  const beat = setInterval(() => ColJob.updateOne({ _id: job._id }, { $set: { heartbeatAt: new Date() } }).catch(() => {}), HEARTBEAT_MS);
  const progress = (done, total, note = '') =>
    ColJob.updateOne({ _id: job._id }, { $set: { progress: { done, total, note }, heartbeatAt: new Date() } }).catch(() => {});
  try {
    const result = await handlers.get(job.type)(job.payload, { progress, jobId: job._id, by: job.by });
    await ColJob.updateOne({ _id: job._id }, { $set: { status: 'DONE', result: result ?? null, finishedAt: new Date() } });
  } catch (e) {
    console.error('[COL JOB]', job.type, job._id.toString(), e.message);
    await ColJob.updateOne({ _id: job._id }, { $set: { status: 'FAILED', error: String(e.message || e).slice(0, 2000), finishedAt: new Date() } });
  } finally { clearInterval(beat); }
  return true;
}

async function loop() {
  if (!running) return;
  try { while (await runOne()) { /* drain */ } } catch (e) { console.error('[COL JOBS]', e.message); }
  timer = setTimeout(loop, POLL_MS);
}

export async function start() {
  if (running) return;
  running = true;
  // Anything left RUNNING by a dead process goes back to the queue.
  const stale = new Date(Date.now() - STALE_MS);
  const r = await ColJob.updateMany({ status: 'RUNNING', $or: [{ heartbeatAt: { $lt: stale } }, { heartbeatAt: null }] },
    { $set: { status: 'QUEUED', error: 'requeued after restart' } });
  if (r.modifiedCount) console.log(`[COL JOBS] re-queued ${r.modifiedCount} stale job(s)`);
  console.log('[COL JOBS] runner started');
  loop();
}
export function stop() { running = false; if (timer) clearTimeout(timer); }
export const status = (id) => ColJob.findById(id).lean();
