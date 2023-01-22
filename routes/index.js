const index = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const auth = require('../middlewares/auth');
const {
  createUser, login, logout,
} = require('../controllers/users');
const { REGEX } = require('../constants/regex');
const NotFoundError = require('../errors/not-found-err');

const pageNotFoundError = (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
};

index.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }).unknown(true),
}), createUser);

index.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), login);

index.post('/signout', logout);

index.use('/users', auth, require('./users'));
index.use('/movies', auth, require('./movies'));

index.use('/', auth, pageNotFoundError);

module.exports = index;
