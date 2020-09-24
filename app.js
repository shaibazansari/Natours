const path = require('path')
const express = require('express');
const rateLimit = require('express-rate-limit')
const helment = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
// console.log(process.env.NODE_ENV);

app.set('view engine', 'pug')
app.set('views', path.join(__dirname,'views'))

// 1.Global Middleware

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname,'public')));

// Set security HTTP headers
app.use(helment())

// Limit no of request from same IP
const limitter = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many request from this IP, Please try again in an hour'
})
app.use('/api',limitter)

// Body parser, getting data from body into request body i.e req.body
app.use(express.json({ limit: '10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb'}));
app.use(cookieParser());

// Data sanitization against NOSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration','ratingQuantity','ratingsAverage','maxGroupSize','difficulty','price']
}))


// Routing
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req,res,next) => {
    // let err = new Error(`Can't find ${req.originalUrl} on this server`)
    // err.statusCode = 404
    // err.status = 'fail'
    next(new AppError(`Can't find ${req.originalUrl} on this server`,404))
})

// Global error handling middleware
app.use(globalErrorHandler)
module.exports = app;
