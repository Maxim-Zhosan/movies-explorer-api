const users = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  updateProfile, getCurrentUser,
} = require('../controllers/users');

users.get('/me', getCurrentUser);
users.patch('/me', celebrate({
  body: Joi.object().keys({
    _id: Joi.string().required(),
    name: Joi.string().required().min(2).max(30),
    email: Joi.string().required(),
  }),
}), updateProfile);

module.exports = users;
