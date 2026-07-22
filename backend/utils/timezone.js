/**
 * Timezone utility for exact Vietnam Timezone (Asia/Ho_Chi_Minh, UTC+7) calculations.
 * Uses standard Intl.DateTimeFormat to avoid manual UTC offset issues at day/month boundaries.
 */

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date string in YYYY-MM-DD format according to Vietnam timezone
 * @returns {string} e.g. "2026-07-22"
 */
function getCurrentDateVN() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Get current month string in YYYY-MM format according to Vietnam timezone
 * @returns {string} e.g. "2026-07"
 */
function getCurrentMonthVN() {
  return getCurrentDateVN().slice(0, 7);
}

/**
 * Get current day of the month as integer (1 to 31) according to Vietnam timezone
 * @returns {number} e.g. 22
 */
function getCurrentDayVN() {
  const dateStr = getCurrentDateVN();
  const dayPart = dateStr.slice(8, 10);
  return parseInt(dayPart, 10);
}

/**
 * Get total number of days in a given month (YYYY-MM)
 * @param {string} monthStr - Format "YYYY-MM" e.g. "2026-07"
 * @returns {number} e.g. 31
 */
function getDaysInMonthVN(monthStr) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    monthStr = getCurrentMonthVN();
  }
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);
  // Day 0 of the next month returns the last day of the target month
  return new Date(year, month, 0).getDate();
}

module.exports = {
  VN_TIMEZONE,
  getCurrentDateVN,
  getCurrentMonthVN,
  getCurrentDayVN,
  getDaysInMonthVN
};
