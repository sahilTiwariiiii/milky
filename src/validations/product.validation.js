const Joi = require('joi');
const { PRODUCT_STATUS, PRODUCT_UNITS } = require('../config/constants');

const createProductSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'any.required': 'Product name is required'
  }),
  category: Joi.string().trim().default('Dairy'),
  unit: Joi.string().trim().required().messages({
    'any.required': 'Product unit is required'
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'Product price is required',
    'number.min': 'Price cannot be negative'
  }),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)).optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  category: Joi.string().trim().optional(),
  unit: Joi.string().trim().optional(),
  price: Joi.number().min(0).optional(),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)).optional()
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema
};
