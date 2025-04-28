const path = require("path")
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/db")
const errorMiddleware = require("./middleware/error")

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

// Initialize app
const app = express()

// Middleware
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "../public")))
app.use(express.json())
app.use(cors());

// Routes
app.use("/api", require("./routes/userRoutes"))
app.use("/api/properties", require("./routes/propertyRoutes"))
app.use("/api/reviews", require("./routes/reviewRoutes")) // Add reviews routes

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  })
})

// Error middleware
app.use(errorMiddleware)

// Export app for server.js
module.exports = app
