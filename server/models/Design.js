const mongoose = require('mongoose');

const DesignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  roomSpecs: {
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    height: { type: Number, required: true },
    shape: { 
      type: String, 
      required: true,
      enum: ['rectangular', 'l-shaped', 'square', 'custom']
    },
    wallColor: { type: String, default: '#ffffff' },
    floorColor: { type: String, default: '#f0f0f0' }
  },
  furniture: [{
    type: {
      type: String,
      required: true
    },
    modelId: {
      type: String,
      required: true
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 }
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 }
    },
    scale: {
      x: { type: Number, default: 1 },
      y: { type: Number, default: 1 },
      z: { type: Number, default: 1 }
    },
    color: { type: String, default: '#ffffff' },
    material: { type: String, default: 'default' }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
DesignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add error handling for validation
DesignSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    next(new Error(errors.join(', ')));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Design', DesignSchema); 