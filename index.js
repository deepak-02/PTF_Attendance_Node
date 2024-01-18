const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const axios = require('axios');
const app = express();
const authRoute = require("./app/Attendance/routes/auth.routes");
const qrRoute = require("./app/Attendance/routes/qr.routes");
const userRoute = require("./app/Attendance/routes/user.routes");
const attendanceRoute = require("./app/Attendance/routes/attendance.routes");
const leaveRoute = require("./app/Attendance/routes/leave.routes");
const notificationRoute = require("./app/Attendance/routes/notification.routes");


const Otp = require('./app/Attendance/models/otp.schema');

var corsOptions = {
    origin: "*"
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const db = require("./app/Attendance/models");


// routes
app.get("/", (req, res) => {
    res.send('Welcome to Attendance app.');
});

app.use('/api/auth', authRoute);
app.use('/api/qr', qrRoute);
app.use('/api/user', userRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/leave', leaveRoute);
app.use('/api/notification', notificationRoute);



// Set up the MongoDB connection
//mongodb+srv://testUser123:testUser123@cluster0.z047vli.mongodb.net/?authMechanism=DEFAULT
//mongodb+srv://ptfattendance:attendance@cluster0.7nng2.mongodb.net/?retryWrites=true&w=majority
//mongodb://0.0.0.0:27017/Attendance
db.mongoose
    .connect(`mongodb+srv://ptfattendance:attendance@cluster0.7nng2.mongodb.net/?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Successfully connected to MongoDB.");
        startOtpCleanupScheduler();
        // startApiCallScheduler(); // Add the function to start API call scheduler
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

// scheduler function , this is used to compramise the idele spindown on render free service

/*  Render spins down a Free web service that goes 15 minutes without receiving inbound traffic. Render spins the service back up whenever it next receives a request to process.

Spinning up a service takes a few seconds, which causes a noticeable delay for incoming requests until the service is back up and running. For example, a browser page load will hang momentarily. */

// function startApiCallScheduler() {
//    // Define the cron job schedule (runs every day at 8:30 AM except Saturday and Sunday)
//    cron.schedule('30 8 * * 1-5', async () => { // 1-5 represents Monday to Friday
//     try {
//             // Make the API call
//             const apiResponse = await axios.get('https://ptf-attendance.onrender.com');

//             // Handle the API response as needed
//             console.log('API Response:', apiResponse.data);
//         } catch (error) {
//             console.error('Error making API call:', error.message);
//         }
//     });
// }