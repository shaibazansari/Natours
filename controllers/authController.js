const crypto = require('crypto')
const { promisify } = require('util')
const User = require('./../models/userModel')
const jwt = require('jsonwebtoken')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const Email = require('./../utils/email')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPERIES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPERIES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions)

    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}
exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body)

    const url = `${req.protocol}://${req.get('host')}/me`
    // console.log(url)
    await new Email(newUser, url).sendWelcome()

    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    // 1. check email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }

    // 2. check user exist and password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Invalid email or password', 401))
    }

    // 3. Send token to client
    createSendToken(user, 200, res)
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'LoggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}

exports.protect = catchAsync(async (req, res, next) => {
    let token

    // 1. check if token exist
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }

    // 2. verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded.id)

    // 3. Check if user still exist
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }
    // 4. check if user changed password after token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! please log in again', 401))
    }
    // grant access to protected

    req.user = currentUser
    res.locals.user = currentUser
    next()
})

exports.isLoggedIn = catchAsync(async (req, res, next) => {
    if (req.cookies.jwt) {
        try {

            // 1. verification token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
            // console.log(decoded.id)

            // 2. Check if user still exist
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) {
                return next()
            }
            // 3. check if user changed password after token was issued
            if (currentUser.changePasswordAfter(decoded.iat)) {
                return next()
            }
            // grant access to protected

            res.locals.user = currentUser
            return next()
        } catch (err) {
            return next()
        }
    }
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user from email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with this email address', 404))
    }
    // 2. generate random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // 3. send it to user's email
    try {
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        await new Email(user, resetUrl).sendPasswordReset()
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined

        await user.save({ validateBeforeSave: false })
        return next(new AppError('There was an error sending the email. Try again later', 500))
    }

})
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    // 2. If token has not expired and there is user, set new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 3. Upadte changePasswordAt property for user
    // 4. Log user in and send JWT
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from collections
    const user = await User.findById(req.user._id).select('+password')

    // 2. Check is POSTed password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Password is incorrect', 404))
    }

    // 3. If so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    // 4. Log user in and send JWT
    createSendToken(user, 200, res)
})