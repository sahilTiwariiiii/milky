const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    orgName: {
      type: String,
      trim: true,
      default: 'Milky Dairy'
    },
    orgLogo: {
      type: String,
      trim: true,
      default: ''
    },
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },
    tagline: {
      type: String,
      trim: true,
      default: 'Pure & Fresh Farm Milk Daily'
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 98765 43210'
    },
    address: {
      type: String,
      trim: true,
      default: 'Central Dairy Sector Hub, Main Road'
    },
    categories: {
      type: [String],
      default: ['Dairy', 'Milk', 'Curd', 'Ghee', 'Paneer']
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
module.exports = SystemConfig;
