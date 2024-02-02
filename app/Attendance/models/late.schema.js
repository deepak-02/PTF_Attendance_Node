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

const Late = mongoose.model("late", lateSchema);

module.exports = Late;
