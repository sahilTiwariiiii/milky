const QRCode = require('qrcode');
const { generateQrToken } = require('../utils/tokenGenerator');
const Customer = require('../models/Customer');

class QrService {
  /**
   * Generates a unique QR token ensuring no collisions in DB
   */
  static async generateUniqueToken(prefix = 'CUST_') {
    let token;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      token = generateQrToken(prefix);
      const existingCustomer = await Customer.findOne({ qrToken: token });
      if (!existingCustomer) {
        exists = false;
      }
      attempts++;
    }

    if (exists) {
      // Fallback with timestamp suffix in the rare event of repeated collisions
      token = `${prefix}${Date.now().toString(36).toUpperCase()}`;
    }

    return token;
  }

  /**
   * Generates a base64 Data URL for the given token
   * @param {string} token - The unique token (e.g., CUST_8F72K91X)
   * @returns {Promise<string>} Base64 Data URL
   */
  static async generateQrCodeDataUrl(token) {
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      },
      width: 300
    };

    return QRCode.toDataURL(token, qrOptions);
  }

  /**
   * Generates both a unique token and its corresponding QR image Data URL
   */
  static async createTokenAndQr() {
    const qrToken = await this.generateUniqueToken();
    const qrCode = await this.generateQrCodeDataUrl(qrToken);
    return { qrToken, qrCode };
  }
}

module.exports = QrService;
