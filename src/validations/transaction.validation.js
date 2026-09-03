const Joi = require('joi');
const { objectIdValidator } = require('./customer.validation');

const createTransactionSchema = Joi.object({
  customerId: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'Customer ID is required',
    'any.invalid': 'Customer ID must be a valid MongoDB ObjectId'
  }),
  productId: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'Product ID is required',
    'any.invalid': 'Product ID must be a valid MongoDB ObjectId'
  }),
  quantity: Joi.number().positive().required().messages({
    'any.required': 'Quantity is required',
    'number.positive': 'Quantity must be greater than 0'
  }),
  notes: Joi.string().trim().allow('').optional()
});

const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(10000).optional(),
  search: Joi.string().trim().allow('').optional(),
  customerId: Joi.alternatives().try(Joi.string().custom(objectIdValidator, 'ObjectId validation'), Joi.string().allow('')).optional(),
  adminId: Joi.alternatives().try(Joi.string().custom(objectIdValidator, 'ObjectId validation'), Joi.string().allow('')).optional(),
  productId: Joi.alternatives().try(Joi.string().custom(objectIdValidator, 'ObjectId validation'), Joi.string().allow('')).optional(),
  startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow('')).optional(),
  endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow('')).optional()
});

module.exports = {
  createTransactionSchema,
  transactionQuerySchema
};
