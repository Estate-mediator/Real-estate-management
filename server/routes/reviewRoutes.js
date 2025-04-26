const express = require("express")
const router = express.Router()
const reviewController = require("../controllers/reviewController")
const auth = require("../middleware/auth")

// Public routes
router.get("/", reviewController.getAllReviews)
router.get("/property/:propertyId", reviewController.getReviewsByPropertyId)
router.post("/", reviewController.createReview)

module.exports = router
