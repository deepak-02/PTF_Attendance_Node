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

// Add indexes for better query performance
leaveSchema.index({ email: 1 });
leaveSchema.index({ leaveId: 1 });
leaveSchema.index({ requestDate: 1 });
leaveSchema.index({ requestStatus: 1 });
leaveSchema.index({ email: 1, requestStatus: 1 }); // Compound index

const Leave = mongoose.model('Leave', leaveSchema);
module.exports=Leave