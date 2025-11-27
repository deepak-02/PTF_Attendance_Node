const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  in: {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    late: {
      type: Boolean,
      default: false,
    },
  },
  out: {
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
  },
  lastScan: {
    type: String,
    enum: ['in', 'out'],
    required: true,
  },
});

// Add indexes for better query performance
attendanceSchema.index({ email: 1 });
attendanceSchema.index({ 'in.date': 1 });
attendanceSchema.index({ email: 1, 'in.date': 1 }); // Compound index for common queries

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
