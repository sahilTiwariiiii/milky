const mongoose = require('mongoose');
const { PRODUCT_STATUS, PRODUCT_UNITS } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    category: {
      type: String,
      trim: true,
      default: 'Dairy'
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: PRODUCT_UNITS.LITRE
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE
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

productSchema.index({ name: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
