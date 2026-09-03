const Joi = require('joi');
const { CUSTOMER_STATUS } = require('../config/constants');

// Custom Joi validator for MongoDB ObjectId
const objectIdValidator = (value, helpers) => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'any.required': 'Customer name is required'
  }),
  mobile: Joi.string().trim().required().messages({
    'any.required': 'Customer mobile number is required'
  }),
  address: Joi.string().trim().allow('').optional(),
  adharNumber: Joi.string().trim().allow('').optional(),
  panNumber: Joi.string().trim().allow('').optional(),
  image: Joi.string().trim().allow('').optional(),
  profileImage: Joi.string().trim().allow('').optional(),
  adminId: Joi.string().custom(objectIdValidator, 'ObjectId validation').optional().messages({
    'any.invalid': 'Assigned Admin ID must be a valid MongoDB ObjectId'
  }),
  status: Joi.string().valid(...Object.values(CUSTOMER_STATUS)).optional()
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  mobile: Joi.string().trim().optional(),
  address: Joi.string().trim().allow('').optional(),
  adharNumber: Joi.string().trim().allow('').optional(),
  panNumber: Joi.string().trim().allow('').optional(),
  image: Joi.string().trim().allow('').optional(),
  profileImage: Joi.string().trim().allow('').optional(),
  adminId: Joi.string().custom(objectIdValidator, 'ObjectId validation').optional().messages({
    'any.invalid': 'Assigned Admin ID must be a valid MongoDB ObjectId'
  }),
  status: Joi.string().valid(...Object.values(CUSTOMER_STATUS)).optional()
}).min(1);

const customerQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(10000).optional(),
  search: Joi.string().trim().allow('').optional(),
  adminId: Joi.alternatives().try(Joi.string().custom(objectIdValidator, 'ObjectId validation'), Joi.string().allow('')).optional(),
  status: Joi.alternatives().try(Joi.string().valid(...Object.values(CUSTOMER_STATUS)), Joi.string().allow('')).optional()
});

module.exports = {
  objectIdValidator,
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema
};
