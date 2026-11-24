const express = require('express');
const { check } = require('express-validator');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getParticipants,
  getMyRegistrations,
} = require('../controllers/eventController');
const { authenticate, optionalAuthenticate, requireAdmin, requireStudent } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my-registrations', authenticate, requireStudent, getMyRegistrations);
router.get('/events', getEvents);
router.get('/events/:id', optionalAuthenticate, getEventById);
router.post(
  '/events',
  authenticate,
  requireAdmin,
  [
    check('title', 'Title is required.').notEmpty(),
    check('description', 'Description is required.').notEmpty(),
    check('category', 'Category is required.').notEmpty(),
    check('date', 'Date is required.').notEmpty(),
    check('startTime', 'Start time is required.').notEmpty(),
    check('venue', 'Venue is required.').notEmpty(),
    check('organizer', 'Organizer is required.').notEmpty(),
  ],
  createEvent
);
router.put('/events/:id', authenticate, requireAdmin, updateEvent);
router.delete('/events/:id', authenticate, requireAdmin, deleteEvent);
router.post(
  '/events/:id/register',
  authenticate,
  requireStudent,
  [check('studentId', 'Student ID must be 80 characters or fewer.').optional({ checkFalsy: true }).isLength({ max: 80 })],
  registerForEvent
);
router.get('/events/:id/participants', authenticate, requireAdmin, getParticipants);

module.exports = router;
