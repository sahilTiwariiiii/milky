/**
 * Date & Formatting Utilities for Dairy Management System
 */

const pad = (n) => String(n).padStart(2, '0');

/**
 * Get date range for the current month: YYYY-MM-01 to YYYY-MM-(lastDay)
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { startDate, endDate, year, month };
};

/**
 * Get date range for a specific month and year
 */
export const getMonthRange = (year, monthIndex) => {
  const startDate = `${year}-${pad(monthIndex + 1)}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`;
  return { startDate, endDate };
};

/**
 * Generate recent months list for dropdown select (e.g. Current Month, Last Month, etc.)
 */
export const getMonthOptions = (count = 12) => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const startDate = `${year}-${pad(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    let label = monthName;
    if (i === 0) label = `Current Month (${monthName})`;
    else if (i === 1) label = `Last Month (${monthName})`;

    options.push({
      id: `${year}-${pad(month + 1)}`,
      label,
      monthName,
      year,
      month,
      startDate,
      endDate
    });
  }
  return options;
};

/**
 * Format date string into '03 Sep 2026'
 */
export const formatDateDisplay = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format datetime string into '03 Sep 2026, 08:30 PM'
 */
export const formatDateTimeDisplay = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format number to Indian Currency
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
