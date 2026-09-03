const mongoose = require('mongoose');
const { CUSTOMER_STATUS } = require('../config/constants');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    adharNumber: {
      type: String,
      trim: true,
      default: ''
    },
    panNumber: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned Admin ID is required'],
      index: true
    },
    qrToken: {
      type: String,
      required: [true, 'QR token is required'],
      unique: true,
      trim: true,
      index: true
    },
    qrCode: {
      type: String,
      required: [true, 'QR code data is required']
    },
    status: {
      type: String,
      enum: Object.values(CUSTOMER_STATUS),
      default: CUSTOMER_STATUS.ACTIVE
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

customerSchema.index({ adminId: 1, status: 1 });
customerSchema.index({ mobile: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
