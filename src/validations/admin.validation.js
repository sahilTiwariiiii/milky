const Joi = require('joi');
const { USER_STATUS } = require('../config/constants');

const createAdminSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  mobile: Joi.string().trim().allow('').optional(),
  profileImage: Joi.string().trim().allow('').optional(),
  status: Joi.string().valid(...Object.values(USER_STATUS)).optional()
});

const updateAdminSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  mobile: Joi.string().trim().allow('').optional(),
  profileImage: Joi.string().trim().allow('').optional(),
  status: Joi.string().valid(...Object.values(USER_STATUS)).optional()
}).min(1);

module.exports = {
  createAdminSchema,
  updateAdminSchema
};
