const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Create Event (Admin only)
router.post('/', authMiddleware, [
  body('name').notEmpty(),
  body('date').isDate(),
  body('location').notEmpty(),
  body('capacity').isNumeric()
], async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { name, date, location, capacity } = req.body;
  
  try {
    const event = new Event({ name, date, location, capacity });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Event (Admin only)
router.put('/:id', authMiddleware, [
  body('name').optional().notEmpty(),
  body('date').optional().isDate(),
  body('location').optional().notEmpty(),
  body('capacity').optional().isNumeric()
], async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { name, date, location, capacity } = req.body;
  
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { name, date, location, capacity }, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Event (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;