const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')

const router = express.Router()

// POST /tour/7845612/reviews
// GET /tour/7845612/reviews
// GET /tour/7845612/reviews/:id
router.use('/:tourId/reviews', reviewRouter)

// router.param('id', tourController.checkId)
router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getAllStats)
router.route('/tour-month/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'guide', 'lead-guide'), 
        tourController.getMonthlyPlan
    )

// /tour-within/400/center/-40,45/unit/mi'
router.route('/tour-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getTourWithin)

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistance)

router.route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    )

router.route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    )


module.exports = router