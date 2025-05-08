const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Design = require('../models/Design');
const mongoose = require('mongoose');

// Get all designs for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const designs = await Design.find({ userId: req.user.id });
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ 
      message: 'Failed to fetch designs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a single design
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid design ID' });
    }

    const design = await Design.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }
    res.json(design);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ 
      message: 'Failed to fetch design',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new design
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new design:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.roomSpecs) {
      return res.status(400).json({ message: 'Name and room specifications are required' });
    }

    const newDesign = new Design({
      ...req.body,
      userId: req.user.id
    });

    const savedDesign = await newDesign.save();
    console.log('Design created successfully:', savedDesign._id);
    res.status(201).json(savedDesign);
  } catch (error) {
    console.error('Error creating design:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to create design',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a design
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid design ID' });
    }

    const design = await Design.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }
    res.json(design);
  } catch (error) {
    console.error('Error updating design:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to update design',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a design
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid design ID' });
    }

    const design = await Design.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }
    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ 
      message: 'Failed to delete design',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 