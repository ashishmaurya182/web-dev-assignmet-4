const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const getEffectiveStatus = (event) => {
  if (!event || !event.date) {
    return 'upcoming';
  }

  const eventDate = new Date(event.date);
  const eventTime = event.startTime || '00:00';
  const eventDateTime = new Date(`${eventDate.toISOString().slice(0, 10)}T${eventTime}:00`);

  if (event.status === 'completed') {
    return 'completed';
  }

  return eventDateTime < new Date() ? 'completed' : 'upcoming';
};

const normalizeEvent = (event) => {
  const plainEvent = event.toObject ? event.toObject() : { ...event };
  plainEvent.status = getEffectiveStatus(plainEvent);
  return plainEvent;
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const validateTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));

const getEvents = async (req, res) => {
  try {
    const { search = '', category = 'All', status = 'All' } = req.query;
    const query = {};

    if (search) {
      const escapedSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { organizer: { $regex: escapedSearch, $options: 'i' } },
        { venue: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const events = await Event.find(query).sort({ date: 1 }).lean();
    const enrichedEvents = events
      .map((event) => {
        const plainEvent = normalizeEvent(event);
        const registeredCount = Number(event.registrationCount) || 0;
        plainEvent.registeredCount = registeredCount;
        plainEvent.remainingSeats = event.capacity ? Math.max(event.capacity - registeredCount, 0) : null;
        plainEvent.availableSeats = plainEvent.remainingSeats;
        return plainEvent;
      })
      .filter((event) => !status || status === 'All' || event.status === String(status).toLowerCase());

    return res.status(200).json({ success: true, data: enrichedEvents });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const plainEvent = normalizeEvent(event);
    const registeredCount = Number(event.registrationCount) || 0;
    plainEvent.registeredCount = registeredCount;
    plainEvent.remainingSeats = event.capacity ? Math.max(event.capacity - registeredCount, 0) : null;
    plainEvent.availableSeats = plainEvent.remainingSeats;

    if (req.user) {
      const isRegistered = await Registration.findOne({ event: event._id, student: req.user._id });
      plainEvent.isRegistered = Boolean(isRegistered);
    }

    return res.status(200).json({ success: true, data: plainEvent });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load event details.' });
  }
};

const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      organizer,
      imageUrl,
      capacity,
      status,
    } = req.body;

    const eventDate = normalizeDateOnly(date);
    if (!eventDate) {
      return res.status(400).json({ success: false, message: 'Enter a valid event date.' });
    }
    if (!validateTime(startTime) || (endTime && !validateTime(endTime))) {
      return res.status(400).json({ success: false, message: 'Enter valid start and end times.' });
    }
    if (endTime && endTime <= startTime) {
      return res.status(400).json({ success: false, message: 'End time must be later than start time.' });
    }

    if (capacity !== undefined && capacity !== null && capacity !== '') {
      const parsedCapacity = Number(capacity);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({ success: false, message: 'Capacity must be a positive whole number.' });
      }
    }

    const event = await Event.create({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      category,
      date,
      startTime,
      endTime: endTime || '',
      venue: String(venue || '').trim(),
      organizer: String(organizer || '').trim(),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      capacity: capacity ? Number(capacity) : null,
      status: status === 'completed' ? 'completed' : 'upcoming',
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const editableFields = [
      'title',
      'description',
      'category',
      'date',
      'startTime',
      'endTime',
      'venue',
      'organizer',
      'imageUrl',
      'capacity',
      'status',
    ];
    const updates = Object.fromEntries(
      editableFields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    if (Object.hasOwn(updates, 'date')) {
      if (!normalizeDateOnly(updates.date)) {
        return res.status(400).json({ success: false, message: 'Enter a valid event date.' });
      }
    }

    const nextStartTime = updates.startTime ?? event.startTime;
    const nextEndTime = Object.hasOwn(updates, 'endTime') ? updates.endTime : event.endTime;
    if (!validateTime(nextStartTime) || (nextEndTime && !validateTime(nextEndTime))) {
      return res.status(400).json({ success: false, message: 'Enter valid start and end times.' });
    }
    if (nextEndTime && nextEndTime <= nextStartTime) {
      return res.status(400).json({ success: false, message: 'End time must be later than start time.' });
    }

    if (Object.hasOwn(updates, 'capacity') && updates.capacity !== null && updates.capacity !== '') {
      updates.capacity = Number(updates.capacity);
      if (!Number.isInteger(updates.capacity) || updates.capacity < 1) {
        return res.status(400).json({ success: false, message: 'Capacity must be a positive whole number.' });
      }
    } else if (Object.hasOwn(updates, 'capacity')) {
      updates.capacity = null;
    }

    if (updates.status) {
      event.status = updates.status === 'completed' ? 'completed' : 'upcoming';
      updates.status = event.status;
    }

    const updateQuery = { _id: event._id };
    if (Number.isInteger(updates.capacity)) {
      updateQuery.$expr = {
        $lte: [{ $ifNull: ['$registrationCount', 0] }, updates.capacity],
      };
    }

    const updatedEvent = await Event.findOneAndUpdate(
      updateQuery,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updatedEvent && Number.isInteger(updates.capacity)) {
      return res.status(400).json({
        success: false,
        message: 'Capacity cannot be lower than the existing registrations.',
      });
    }

    return res.status(200).json({ success: true, data: normalizeEvent(updatedEvent || event) });
  } catch (error) {
    return next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    await Event.updateOne({ _id: event._id }, { $set: { status: 'completed' } });
    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(event._id);

    return res.status(200).json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (getEffectiveStatus(event) === 'completed') {
      return res.status(400).json({ success: false, message: 'This event is completed.' });
    }

    const alreadyRegistered = await Registration.exists({ event: event._id, student: req.user._id });
    if (alreadyRegistered) {
      return res.status(409).json({ success: false, message: 'You are already registered for this event.' });
    }

    const claimedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        status: 'upcoming',
        $expr: {
          $or: [
            { $eq: [{ $ifNull: ['$capacity', null] }, null] },
            { $lt: [{ $ifNull: ['$registrationCount', 0] }, '$capacity'] },
          ],
        },
      },
      { $inc: { registrationCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!claimedEvent) {
      return res.status(400).json({ success: false, message: 'This event is full or no longer accepting registrations.' });
    }

    let registration;
    try {
      registration = await Registration.create({
        event: event._id,
        student: req.user._id,
        studentName: req.user.name,
        studentEmail: req.user.email,
        studentId: String(req.body.studentId || req.user.studentId || '').trim() || 'N/A',
        registeredAt: new Date(),
      });
    } catch (error) {
      await Event.updateOne(
        { _id: event._id, registrationCount: { $gt: 0 } },
        { $inc: { registrationCount: -1 } }
      );
      throw error;
    }

    if (!await Event.exists({ _id: event._id })) {
      await Registration.deleteOne({ _id: registration._id });
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(201).json({ success: true, data: registration });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You are already registered for this event.' });
    }
    return next(error);
  }
};

const getParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const [registrations, total] = await Promise.all([
      Registration.find({ event: event._id })
        .sort({ registeredAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Registration.countDocuments({ event: event._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: registrations,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch participants.' });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id })
      .sort({ registeredAt: -1, _id: -1 })
      .populate('event')
      .lean();
    const data = registrations.map((registration) => {
      const event = registration.event || {};
      return {
        _id: registration._id,
        eventId: event._id,
        eventTitle: event.title,
        category: event.category,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        organizer: event.organizer,
        registeredAt: registration.registeredAt,
        studentId: registration.studentId === 'N/A' ? '' : registration.studentId,
        status: getEffectiveStatus(event),
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch registrations.' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getParticipants,
  getMyRegistrations,
  getEffectiveStatus,
};
