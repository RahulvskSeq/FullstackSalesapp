// Payment-commitment helpers, shared by the follow-up routes and the
// Saturday outstanding upload.
//
// A COMMITMENT is a follow-up carrying a promised amount: "the dealer will
// pay ₹X by <date>". Money is credited against it either by an admin /
// accounts user entering a collection, or automatically when the weekly
// outstanding sheet shows the dealer's balance dropped.
//
//   received = creditedManual + creditedFromUpload (legacy collectedAmount
//              counts too, so pre-existing records keep working)
//   OPEN     → promise date in the future, received < promised
//   BROKEN   → promise date passed,        received < promised
//   SETTLED  → received >= promised
//
// Only BROKEN commitments belong in the Commitments tab; a settled one
// disappears from it and the dealer goes back to the normal Outstanding flow.

export const receivedOn = (f) =>
  (Number(f.creditedManual) || 0) +
  (Number(f.creditedFromUpload) || 0) +
  // Legacy: records made before commitment tracking existed stored the
  // receipt in collectedAmount only.
  ((!f.creditedManual && !f.creditedFromUpload) ? (Number(f.collectedAmount) || 0) : 0);

export const isCommitment = (f) =>
  !!f && f.type !== 'collection' && (Number(f.amount) || 0) > 0;

export const shortfallOf = (f) => Math.max(0, (Number(f.amount) || 0) - receivedOn(f));

export const isSettled = (f) => isCommitment(f) && receivedOn(f) >= (Number(f.amount) || 0);

// Local-date 'YYYY-MM-DD' — commitments are compared on calendar days, not
// timestamps, so a promise due today is never treated as already broken.
export const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

export const commitmentState = (f, today = todayStr()) => {
  if (!isCommitment(f)) return null;
  if (isSettled(f)) return 'SETTLED';
  return (f.followupDate && f.followupDate < today) ? 'BROKEN' : 'OPEN';
};

/**
 * Apply `amount` to a dealer's unsettled commitments, oldest promise first.
 * Used by the weekly upload (source 'upload') and by manual entry when an
 * admin credits a dealer without picking a specific commitment.
 * Returns { applied, settled, touched:[{id, applied, nowSettled}] }.
 */
export async function creditDealerCommitments(Model, dealerName, amount, { source = 'upload', by = '', batchId = '', note = '' } = {}) {
  let remaining = Math.round(Number(amount) || 0);
  const out = { applied: 0, settled: 0, touched: [] };
  if (remaining <= 0 || !dealerName) return out;

  const rx = new RegExp(`^${String(dealerName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const open = (await Model.find({ dealerName: rx, amount: { $gt: 0 }, type: { $ne: 'collection' } })
    .sort({ followupDate: 1, createdAt: 1 }))
    .filter(f => !isSettled(f));

  for (const f of open) {
    if (remaining <= 0) break;
    const gap = shortfallOf(f);
    if (gap <= 0) continue;
    const give = Math.min(gap, remaining);
    if (source === 'upload') f.creditedFromUpload = (Number(f.creditedFromUpload) || 0) + give;
    else                      f.creditedManual     = (Number(f.creditedManual)     || 0) + give;
    f.credits.push({ amount: give, source, by, at: new Date(), note, batchId });
    remaining -= give;
    out.applied += give;

    const nowSettled = isSettled(f);
    if (nowSettled) {
      f.settledAt = new Date();
      f.status = 'done';
      f.collectedAt = f.collectedAt || new Date();
      out.settled++;
    }
    await f.save();
    out.touched.push({ id: f._id.toString(), applied: give, nowSettled });
  }
  return out;
}
