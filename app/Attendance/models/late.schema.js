const mongoose = require("mongoose");

const lateSchema = new mongoose.Schema(
    {
        lateId: String,
        email: String,
        willLate: Boolean,
        reason: String,
        on: Date,
        requestedOn: String,
        status: {
            type: String,
            enum: ['requested', 'approved', 'rejected'],
        },
        requestMethod: {
            type: String,
            enum: ['app', 'call'],
        }

    }

);

// Add indexes for better query performance
lateSchema.index({ email: 1 });
lateSchema.index({ lateId: 1 });
lateSchema.index({ on: 1 });
lateSchema.index({ status: 1 });
lateSchema.index({ email: 1, on: 1 }); // Compound index for date queries

const Late = mongoose.model("late", lateSchema);

module.exports = Late;
