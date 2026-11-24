const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const router = express.Router();

router.delete('/registrations/:id', authenticate, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    if (req.user.role !== 'admin' && registration.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot delete someone else\'s registration.' });
    }

    const deleteQuery = { _id: registration._id };
    if (req.user.role !== 'admin') {
      deleteQuery.student = req.user._id;
    }

    const deletedRegistration = await Registration.findOneAndDelete(deleteQuery);
    if (!deletedRegistration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    await Event.updateOne(
      { _id: deletedRegistration.event, registrationCount: { $gt: 0 } },
      { $inc: { registrationCount: -1 } }
    );
    return res.status(200).json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to cancel registration.' });
  }
});

module.exports = router;
