const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.qr = require("./qr.schema");
db.attendance = require("./attendance.schema");
db.image = require("./image.schema");
db.otp = require("./otp.schema");
db.leave = require("./leave.schema");
db.notification = require("./notification.schema");
db.late = require("./late.schema");



db.ROLES = ["user", "admin"];

module.exports = db;