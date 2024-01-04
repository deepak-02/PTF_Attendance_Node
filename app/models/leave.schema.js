const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    email: String,
    leaveId: {
      type: String,
      required: true,
      unique: true,
  },
    requestDate: String,
    toDate: String,
    reason: String,
    type:  {
      type: String,
      enum: ['casual', 'sick'],
      required: true,
    },
    requestStatus: {
        type: String,
        enum: ['requested', 'approved', 'rejected'],
        required: true,
      },
    requestedOn: String,
    approvedOrRejectedOn: String,
});

const Leave = mongoose.model('Leave', leaveSchema);
module.exports=Leave