// Office holidays (company holiday calendar). Shown on the visit calendar as a
// watermark, so a visit planned on one stands out. Add next year's list here.
//   holiday — office closed · compoff — comp off given · half — half day
export const HOLIDAYS = {
  '2026-01-14': { name: 'Makara Sankranti',   type: 'compoff' },
  '2026-01-26': { name: 'Republic Day',       type: 'compoff' },
  '2026-03-04': { name: 'Holi',               type: 'half' },
  '2026-03-26': { name: 'Ugadi',              type: 'compoff' },
  '2026-03-31': { name: 'Mahaveer Jayanthi',  type: 'holiday' },
  '2026-08-15': { name: 'Independence Day',   type: 'compoff' },
  '2026-09-15': { name: 'Ganesh Chaturthi',   type: 'holiday' },
  '2026-10-20': { name: 'Dussehra',           type: 'holiday' },
  '2026-11-01': { name: 'Kannada Rajyotsava', type: 'holiday' },
  '2026-11-08': { name: 'Diwali',             type: 'holiday' },
  '2026-12-25': { name: 'Christmas',          type: 'compoff' },
};
export const HOLIDAY_LABEL = { holiday: 'Office holiday', compoff: 'Comp off', half: 'Half day' };
export const HOLIDAY_TONE  = { holiday: '#e11d48', compoff: '#d97706', half: '#2563eb' };
/** The holiday on a 'YYYY-MM-DD' date, or null. */
export const holidayOn = ymd => HOLIDAYS[ymd] || null;
