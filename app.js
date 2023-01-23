require('dotenv').config();
const rateLimit = require('express-rate-limit');
const express = require('express');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const { errHandler } = require('./middlewares/err-handler');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const { corsHandler } = require('./middlewares/cors-handler');
// const cookieParser = require("cookie-parser");

const { PORT = 3000 } = process.env;
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter); // Apply the rate limiting middleware to all requests
app.use((req, res, next) => corsHandler(req, res, next));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // подключаем логгер запросов
// app.use(cookieParser());
mongoose.connect('mongodb://localhost:27017/bitfilmsdb');

app.use('/api', require('./routes/index'));

app.use(errorLogger); // подключаем логгер ошибок
app.use(errors()); // обработчик ошибок celebrate
app.use((err, req, res, next) => errHandler(err, req, res, next));

app.listen(PORT);
