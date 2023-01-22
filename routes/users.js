const users = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  updateProfile, getCurrentUser,
} = require('../controllers/users');
const { REGEX } = require('../constants/regex');

users.get('/me', getCurrentUser);
users.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
  }),
}), updateProfile);

module.exports = users;
