// controllers/propertyController.js
const Property = require('../models/Property');

// Create new property
exports.createProperty = async (req, res) => {
  try {
    // Only landlords can create properties
    if (req.user.userType !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can create property listings'
      });
    }

    const propertyData = {
      ...req.body,
      owner: req.user._id
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating property'
    });
  }
};

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const { 
      minPrice, maxPrice, propertyType, 
      city, bedrooms, bathrooms, status
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) {
      filter.price = { ...filter.price, $lte: maxPrice };
    }
    if (propertyType) filter.propertyType = propertyType;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (bedrooms) filter.bedrooms = { $gte: bedrooms };
    if (bathrooms) filter.bathrooms = { $gte: bathrooms };
    if (status) filter.status = status;
    
    const properties = await Property.find(filter)
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties'
    });
  }
};

// Get property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property'
    });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user is the property owner
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this property'
      });
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json({
      success: true,
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating property'
    });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user is the property owner
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this property'
      });
    }
    
    await Property.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property'
    });
  }
};