import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePeriodHeader, resolvePeriods, parseParty, normName, monthIndex, sortPeriods, isNoiseParty, OLDER } from '../lib/periods.js';
import { toRupees } from '../lib/money.js';

test('month names in every spelling the files use', () => {
  for (const [h, mi] of [['Aug', 7], ['(3)\r\nAug', 7], ['AUGUST', 7], ['Sept', 8], ['JUNE', 5], ['may', 4], ['(13)\nJun', 5]])
    assert.equal(monthIndex(h), mi, h);
  assert.equal(monthIndex('Total'), -1);
});

test('period headers with and without years', () => {
  assert.deepEqual(parsePeriodHeader('Aug-26'), { mi: 7, year: 2026 });
  assert.deepEqual(parsePeriodHeader('Aug 2026'), { mi: 7, year: 2026 });
  assert.deepEqual(parsePeriodHeader('2026-08'), { mi: 7, year: 2026 });
  assert.deepEqual(parsePeriodHeader('2026-08-25T18:29:50.000Z'), { mi: 7, year: 2026 });
  assert.deepEqual(parsePeriodHeader(new Date(2026, 4, 25)), { mi: 4, year: 2026 });
  assert.deepEqual(parsePeriodHeader('Aug'), { mi: 7, year: null });
  assert.deepEqual(parsePeriodHeader('OLD'), { older: true });
  assert.equal(parsePeriodHeader('Dealer Name'), null);
  assert.equal(parsePeriodHeader(''), null);
});

test('the real 11-column file: Aug…Jun resolves across the year boundary', () => {
  const headers = ['(3)\r\nAug', '(4)\r\nSep', '(5)\r\nOct', '(6)\r\nNov', '(7)\r\nDec', '(8)\r\nJan', '(9)\r\nFeb', '(10)\r\nMar', '(11)\r\nApr', '(12)\r\nMay', '(13)\r\nJun'];
  assert.deepEqual(resolvePeriods(headers, { asOn: '2026-07-04' }),
    ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']);
});

test('the template: OLD, bare months and explicit months mixed', () => {
  const headers = ['Dealer Name', 'OLD', 'Mar', 'Apr', 'May', 'Jun', 'Mar-26', 'Apr-26', 'May-26'];
  const r = resolvePeriods(headers, { asOn: '2026-06-30' });
  assert.equal(r[0], null);
  assert.equal(r[1], OLDER);
  assert.deepEqual(r.slice(2, 6), ['2026-03', '2026-04', '2026-05', '2026-06']);
  assert.deepEqual(r.slice(6), ['2026-03', '2026-04', '2026-05']);
});

test('legacy uppercase labels resolve relative to their statement date', () => {
  assert.deepEqual(resolvePeriods(['MAY', 'JUNE', 'JULY'], { asOn: '2026-07-18' }), ['2026-05', '2026-06', '2026-07']);
});

test('a bare month after asOn belongs to the previous year', () => {
  assert.deepEqual(resolvePeriods(['Nov', 'Dec', 'Jan'], { asOn: '2026-01-15' }), ['2025-11', '2025-12', '2026-01']);
});

test('party codes in every shape seen', () => {
  assert.deepEqual(parseParty('CASA LUSSO-SSL14140'), { name: 'CASA LUSSO', code: 'SSL14140' });
  assert.deepEqual(parseParty('A.V. INTERIOR SOLUTIONS-SSL16566'), { name: 'A.V. INTERIOR SOLUTIONS', code: 'SSL16566' });
  assert.deepEqual(parseParty('CASA LUSSO - SSL 14140'), { name: 'CASA LUSSO', code: 'SSL14140' });
  assert.deepEqual(parseParty('CASA LUSSO (SSL14140)'), { name: 'CASA LUSSO', code: 'SSL14140' });
  assert.deepEqual(parseParty('CASH SALES (HYD)'), { name: 'CASH SALES (HYD)', code: '' });
  assert.deepEqual(parseParty('  MAHAVEER   TIMBERS '), { name: 'MAHAVEER TIMBERS', code: '' });
  assert.deepEqual(parseParty('SSL14140'), { name: '', code: 'SSL14140' });
});

test('name key ignores case, spacing and punctuation but is not fuzzy', () => {
  assert.equal(normName('Vayuputhra  Glass & Plywoods.'), normName('VAYUPUTHRA GLASS PLYWOODS'));
  assert.notEqual(normName('SHREE GEETA PLYWOOD & HARDWARE'), normName('SHREE GEETA HARDWARE'));
});

test('noise rows', () => {
  for (const n of ['Total', 'GRAND TOTAL', 'Dealer Name', '', '1,23,456', '—']) assert.equal(isNoiseParty(n), true, n);
  assert.equal(isNoiseParty('DECOR POINT'), false);
});

test('rupees from spreadsheet cells', () => {
  assert.equal(toRupees('1,23,456.00'), 123456);
  assert.equal(toRupees('₹ 5,000'), 5000);
  assert.equal(toRupees('(500)'), -500);
  assert.equal(toRupees('12,000 Dr'), 12000);
  assert.equal(toRupees('12,000 Cr'), -12000);
  assert.equal(toRupees(''), 0);
  assert.equal(toRupees(null), 0);
  assert.equal(toRupees(16000), 16000);
  assert.equal(toRupees(16000.4), 16000);
  assert.ok(Number.isNaN(toRupees('abc')));
});

test('sortPeriods puts OLDER first', () => {
  assert.deepEqual(sortPeriods(['2026-06', OLDER, '2025-08']), [OLDER, '2025-08', '2026-06']);
});

test('parseParty: a remark after the code is dropped from the name, the code still binds', () => {
  assert.deepEqual(parseParty('KANDAKATLA ARJUN RAO GLASS MART-SSL15821 (ONLY DISPLAY)'), { name: 'KANDAKATLA ARJUN RAO GLASS MART', code: 'SSL15821' });
  assert.deepEqual(parseParty('HARI PRASHAD(HYD)SSL15443'), { name: 'HARI PRASHAD(HYD)', code: 'SSL15443' });
  assert.deepEqual(parseParty('CASH SALES (HYD)'), { name: 'CASH SALES (HYD)', code: '' });
});
