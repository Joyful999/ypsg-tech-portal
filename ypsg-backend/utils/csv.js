// =========================================================
// Minimal CSV builder (no external dependency needed for this)
// =========================================================

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string}
 */
function toCsv(headers, rows) {
  const lines = [headers.map(escapeCsvValue).join(',')];
  rows.forEach(row => lines.push(row.map(escapeCsvValue).join(',')));
  return lines.join('\n');
}

module.exports = { toCsv };
