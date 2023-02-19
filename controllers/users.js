const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const { NODE_ENV, JWT_SECRET } = process.env;
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const UnauthorizedError = require('../errors/unauthorized-err');
const ConflictError = require('../errors/conflict-err');

module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Пользователь с указанным _id не найден'));
      } else {
        res.send(
          {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        );
      }
    })
    .catch(next);
};

module.exports.updateProfile = (req, res, next) => {
  const { _id, name, email } = req.body;
  User.findOne( {
    $and : [
      {email: email}, {_id: {$ne : _id}}
    ]
  } )
    .then((user) => {
      if (user) {
        next(new ConflictError(user))
      } else {
        User.findByIdAndUpdate(
          req.user._id,
          { name, email },
          {
            new: true, // обработчик then получит на вход обновлённую запись
            runValidators: true, // данные будут валидированы перед изменением
            upsert: false, // если пользователь не найден, вернётся ошибка
          },
        )
          .then((user) => {
            if (!user) {
              next(new NotFoundError('Пользователь с указанным _id не найден'));
            } else {
              res.send(
                {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                },
              );
            }
          })
          .catch((err) => {
            if (err.name === 'ValidationError') {
              next(new BadRequestError('Переданы некорректные данные при обновлении профиля'));
            } else {
              next(err);
            }
          });
      }
    })
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        next(new UnauthorizedError('Неправильные почта или пароль'));
      } else {
        bcrypt.compare(password, user.password)
          .then((matched) => {
            if (!matched) {
              // хеши не совпали — отклоняем промис
              next(new UnauthorizedError('Неправильные почта или пароль'));
            } else {
              // аутентификация успешна
              const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
              res
                .cookie('jwt', token, {
                  // token - наш JWT токен, который мы отправляем
                  maxAge: 3600000,
                  httpOnly: true,
                  secure: true,
                })
                .send({
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                })
                .end();
            }
          });
      }
    })
    .catch(next);
};

module.exports.logout = (req, res, next) => {
  const { cookie } = req.headers;
  if (!cookie || !cookie.startsWith('jwt=')) {
    next(new UnauthorizedError('Необходима авторизация'));
  }
  res.status(202).clearCookie('jwt').send({})
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        next(new ConflictError('Пользователь с таким email уже существует'));
      } else {
        bcrypt.hash(password, 10)
          .then((hash) => User.create({
            name, email, password: hash,
          }))
          .then((newUser) => res.status(201).send(
            {
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
            },
          ))
          .catch((err) => {
            if (err.name === 'ValidationError') {
              next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
            } else {
              next(err);
            }
          });
      }
    })
    .catch(next);
};
