const crypto = require('crypto');

/**
 * Generate a random alphanumeric token with a prefix
 * Format: CUST_8F72K91X (8 uppercase chars)
 */
const generateQrToken = (prefix = 'CUST_') => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32-like alphabet avoiding ambiguous chars (0/O, 1/I)
  const bytes = crypto.randomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${prefix}${result}`;
};

module.exports = {
  generateQrToken
};
