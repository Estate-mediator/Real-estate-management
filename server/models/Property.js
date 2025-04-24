
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'sold', 'pending'],
    default: 'available'
  },
  price: {
    type: Number,
    required: true
  },
  rentalPrice: Number,
  size: Number,
  bedrooms: Number,
  bathrooms: Number,
  amenities: [String],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Property', propertySchema);