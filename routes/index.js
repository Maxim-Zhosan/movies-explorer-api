const index = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const auth = require('../middlewares/auth');
const {
  createUser, login, logout,
} = require('../controllers/users');
const NotFoundError = require('../errors/not-found-err');

const pageNotFoundError = (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
};

index.post('/api/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }).unknown(true),
}), createUser);

index.post('/api/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), login);

index.post('/api/signout', logout);

index.use('/api/users', auth, require('./users'));
index.use('/api/movies', auth, require('./movies'));

index.use('/', auth, pageNotFoundError);

module.exports = index;
