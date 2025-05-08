const express = require('express');
const router = express.Router();
const Furniture = require('../models/Furniture');
const auth = require('../middleware/auth');

// Get all furniture items
router.get('/', async (req, res) => {
  try {
    const furniture = await Furniture.find();
    res.json(furniture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get furniture by category
router.get('/category/:category', async (req, res) => {
  try {
    const furniture = await Furniture.find({ category: req.params.category });
    res.json(furniture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single furniture item
router.get('/:id', async (req, res) => {
  try {
    const furniture = await Furniture.findById(req.params.id);
    if (!furniture) {
      return res.status(404).json({ message: 'Furniture not found' });
    }
    res.json(furniture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new furniture item (admin only)
router.post('/', auth, async (req, res) => {
  const furniture = new Furniture(req.body);
  try {
    const newFurniture = await furniture.save();
    res.status(201).json(newFurniture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update furniture item (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const furniture = await Furniture.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!furniture) {
      return res.status(404).json({ message: 'Furniture not found' });
    }
    res.json(furniture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete furniture item (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const furniture = await Furniture.findByIdAndDelete(req.params.id);
    if (!furniture) {
      return res.status(404).json({ message: 'Furniture not found' });
    }
    res.json({ message: 'Furniture deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 