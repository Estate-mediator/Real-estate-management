const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  userType: { type: String, enum: ['tenant', 'landlord', 'custodian'], required: true },
  // Fields for tenant
  occupation: String,
  budget: Number,
  preferredLocation: String,
  // Fields for landlord
  propertyCount: Number,
  propertyType: String,
  businessName: String,
  // Fields for custodian
  experience: Number,
  skills: String,
  availability: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);