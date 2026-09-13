import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, computeTotal, oldestPeriodOf, derivePriority, deriveStatus } from '../engines/reconcile.js';

test('classification table', () => {
  const c = (prevExists, prevTotal, curTotal, prior) => classify({ prevExists, prevTotal, curTotal, priorCycleStatus: prior });
  assert.equal(c(false, null, 100000, undefined), 'NEW');
  assert.equal(c(false, null, 0, undefined), 'UNCHANGED');
  assert.equal(c(true, 100000, 140000, 'OPEN'), 'INCREASED');
  assert.equal(c(true, 100000, 70000, 'OPEN'), 'DECREASED');
  assert.equal(c(true, 70000, 0, 'OPEN'), 'CLEARED');
  assert.equal(c(true, 50000, 50000, 'OPEN'), 'UNCHANGED');
  assert.equal(c(true, 0, 50000, 'CLEARED'), 'REOPENED');
  assert.equal(c(false, null, 50000, 'CLEARED'), 'REOPENED');
  assert.equal(c(true, 0, 0, 'CLEARED'), 'UNCHANGED');
});

test('total follows the statement\'s meaning of a column', () => {
  const b = { '2026-01': 16000, '2026-06': 500, '2026-03': 0 };
  assert.equal(computeTotal(b, 'buckets'), 16500);
  assert.equal(computeTotal(b, 'snapshot'), 500);
  assert.equal(computeTotal({ OLDER: 3000, '2026-05': 200 }, 'buckets'), 3200);
  assert.equal(computeTotal({ OLDER: 3000, '2026-05': 200 }, 'snapshot'), 200);
  assert.equal(computeTotal({}, 'buckets'), 0);
});

test('oldest live bucket, OLDER first', () => {
  assert.equal(oldestPeriodOf({ '2026-06': 500, '2026-01': 16000 }), '2026-01');
  assert.equal(oldestPeriodOf({ '2026-06': 500, '2026-01': 0 }), '2026-06');
  assert.equal(oldestPeriodOf({ OLDER: 10, '2025-08': 5 }), 'OLDER');
  assert.equal(oldestPeriodOf({}), '');
});

test('priority from thresholds, bumped by broken promises', () => {
  const t = { critical: { total: 1000000, ageDays: 120 }, high: { total: 300000, ageDays: 90 }, medium: { total: 50000, ageDays: 30 } };
  assert.equal(derivePriority({ total: 10000, ageDays: 5, brokenPromises: 0 }, t), 'LOW');
  assert.equal(derivePriority({ total: 60000, ageDays: 5, brokenPromises: 0 }, t), 'MEDIUM');
  assert.equal(derivePriority({ total: 10000, ageDays: 95, brokenPromises: 0 }, t), 'HIGH');
  assert.equal(derivePriority({ total: 2000000, ageDays: 0, brokenPromises: 0 }, t), 'CRITICAL');
  assert.equal(derivePriority({ total: 60000, ageDays: 5, brokenPromises: 2 }, t), 'HIGH');
  assert.equal(derivePriority({ total: 10000, ageDays: null, brokenPromises: 0 }, t), 'LOW');
});

test('status precedence', () => {
  const cfg = { overdueDays: 90, highValue: 500000 };
  const cyc = { status: 'OPEN', openedAt: new Date('2026-06-01') };
  const T = '2026-09-13';
  assert.equal(deriveStatus({ total: 0 }, cyc, cfg, T), 'CLEARED');
  assert.equal(deriveStatus({ total: 0 }, null, cfg, T), 'NIL', 'never owed → NIL, not CLEARED');
  assert.equal(deriveStatus({ total: 0 }, { status: 'CLOSED_MANUAL' }, cfg, T), 'CLOSED');
  assert.equal(deriveStatus({ total: 100, promise: { amount: 50, date: '2026-09-20' } }, cyc, cfg, T), 'PROMISED');
  assert.equal(deriveStatus({ total: 100, promise: { amount: 50, date: '2026-09-01' }, brokenPromises: 1 }, cyc, cfg, T), 'FOLLOW_UP_REQUIRED');
  assert.equal(deriveStatus({ total: 100, lastPaymentAt: new Date('2026-07-01') }, cyc, cfg, T), 'PARTIAL_PAYMENT');
  assert.equal(deriveStatus({ total: 600000, ageDays: 10 }, cyc, cfg, T), 'HIGH_PRIORITY');
  assert.equal(deriveStatus({ total: 100, ageDays: 120 }, cyc, cfg, T), 'OVERDUE');
  assert.equal(deriveStatus({ total: 100, ageDays: 10 }, cyc, cfg, T), 'DUE');
  assert.equal(deriveStatus({ total: 100, ageDays: 10, lastFollowupAt: new Date('2026-07-01') }, cyc, cfg, T), 'DUE');
});
