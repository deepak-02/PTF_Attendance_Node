const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const app = express();
const authRoute = require("./app/routes/auth.routes");
const qrRoute = require("./app/routes/qr.routes");
const userRoute = require("./app/routes/user.routes");
const attendanceRoute = require("./app/routes/attendance.routes");
const leaveRoute = require("./app/routes/leave.routes");

const Otp = require('./app/models/otp.schema');

var corsOptions = {
    origin: "*"
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const db = require("./app/models");


// routes
app.get("/", (req, res) => {
    res.send('Welcome to Attendance app.');
});

app.use('/api/auth', authRoute);
app.use('/api/qr', qrRoute);
app.use('/api/user', userRoute);
app.use('/api/attendance',attendanceRoute);
app.use('/api/leave', leaveRoute);


// Set up the MongoDB connection
//mongodb+srv://testUser123:testUser123@cluster0.z047vli.mongodb.net/?authMechanism=DEFAULT
//mongodb://0.0.0.0:27017/Attendance
db.mongoose
    .connect(`mongodb+srv://testUser123:testUser123@cluster0.z047vli.mongodb.net/?authMechanism=DEFAULT`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Successfully connected to MongoDB.");
        startOtpCleanupScheduler();
    })
    .catch(err => {
        console.error("Connection error", err);
        process.exit();
    });

// Set the port and start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});


function startOtpCleanupScheduler() {
    // Define the cron job schedule (runs every minute)
    cron.schedule('* * * * *', async () => {
        try {
            // Find all expired OTPs
            const expiredOtps = await Otp.find({ createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } });

            // Delete the expired OTPs
            await Otp.deleteMany({ _id: { $in: expiredOtps.map(otp => otp._id) } });

            console.log(`${expiredOtps.length} expired OTP(s) deleted.`);
        } catch (error) {
            console.error('Error deleting expired OTPs:', error);
        }
    });
}