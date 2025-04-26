const Review = require("../models/Review")
const Property = require("../models/Property")

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { propertyId, name, title, rating, comment } = req.body

    // Check if property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      })
    }

    const review = new Review({
      propertyId,
      name,
      title,
      rating,
      comment,
    })

    await review.save()

    res.status(201).json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({
      success: false,
      message: "Error creating review",
    })
  }
}

// Get all reviews for a property
exports.getReviewsByPropertyId = async (req, res) => {
  try {
    const { propertyId } = req.params

    const reviews = await Review.find({ propertyId }).sort({ createdAt: -1 })

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    })
  } catch (error) {
    console.error("Get reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
    })
  }
}

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    })
  } catch (error) {
    console.error("Get all reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
    })
  }
}
