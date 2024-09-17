const express = require('express');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Book Event
router.post('/', authMiddleware, [
  body('event').notEmpty(),
  body('slots').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { event: eventId, slots } = req.body;
  const user = req.user;

  try {
    const foundEvent = await Event.findById(eventId);
    if (!foundEvent) return res.status(404).json({ message: 'Event not found' });

    // Check if booking slots are available
    const totalBooked = foundEvent.bookings.reduce((acc, booking) => acc + booking.slots, 0);
    if (foundEvent.capacity - totalBooked < slots) return res.status(400).json({ message: 'Not enough slots available' });

    // Create booking
    const booking = new Booking({
      user: user._id,
      event: eventId,
      slots
    });
    await booking.save();

    // Update event bookings
    foundEvent.bookings.push({ user: user._id, slots });
    await foundEvent.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel Booking
router.delete('/:id', authMiddleware, async (req, res) => {
  const bookingId = req.params.id;
  const user = req.user;

  try {
    // Find and validate the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    // Remove booking
    const event = await Event.findById(booking.event);
    event.bookings = event.bookings.filter(b => b._id.toString() !== bookingId);
    await event.save();

    await booking.remove();
    res.json({ message: 'Booking canceled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Bookings
router.get('/me', authMiddleware, async (req, res) => {
  const user = req.user;

  try {
    const bookings = await Booking.find({ user: user._id }).populate('event');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Event Bookings
router.get('/event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId).populate('bookings.user');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.json(event.bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;