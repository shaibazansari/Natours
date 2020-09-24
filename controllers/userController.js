const multer = require('multer')
const sharp = require('sharp')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handleFactory')

// const multerStorage = multer.diskStorage({
//     destination: (req,file,cb) => {
//         cb(null,'public/img/users')
//     },
//     filename: (req,file,cb) => {
//         // user-77854adadnjh545-125756421.jpg
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload images only.', 404), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.userUploadPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next()

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)

    next()
})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getAllusers = catchAsync(async (req, res) => {
    const users = await User.find()

    res.status(201).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
})

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

exports.updateMe = catchAsync(async (req, res, next) => {

    // 1. Create error if user POST password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password update. Please use /updateMyPassword.', 400))
    }

    // 2. Filtered out unwanted fields which are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email')
    if (req.file) filterBody.photo = req.file.filename

    // 3. Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true })

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'success',
        messsage: 'This route is not defined Instead use /signup'
    })
}
exports.getUser = factory.getOne(User)
// Not to change Password here
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)