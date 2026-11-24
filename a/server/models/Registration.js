const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      default: 'N/A',
      maxlength: 80,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, student: 1 }, { unique: true });
registrationSchema.index({ student: 1, registeredAt: -1 });
registrationSchema.index({ event: 1, registeredAt: -1 });

module.exports = mongoose.model('Registration', registrationSchema);
