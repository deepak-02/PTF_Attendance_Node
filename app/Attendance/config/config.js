require('dotenv').config();

module.exports = {
    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://testUser123:testUser123@cluster0.z047vli.mongodb.net/?authMechanism=DEFAULT'
    },

    // Email Configuration
    email: {
        user: process.env.EMAIL_USER || 'ptfattendanceapp@gmail.com',
        pass: process.env.EMAIL_PASS || 'vkxhfuwbaygppaim',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true
    },

    // Firebase Configuration
    firebase: {
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './app/Attendance/attendance-dd5f2-firebase-adminsdk-eg6lr-27f3554625.json'
    },

    // Server Configuration
    server: {
        port: process.env.PORT || 8080,
        env: process.env.NODE_ENV || 'development'
    },

    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
    },

    // Attendance Time Windows (in minutes from midnight)
    attendance: {
        lateMorningStart: parseInt(process.env.LATE_MORNING_START) || 580,    // 9:40 AM
        lateMorningEnd: parseInt(process.env.LATE_MORNING_END) || 720,        // 12:00 PM
        lateAfternoonStart: parseInt(process.env.LATE_AFTERNOON_START) || 820, // 1:40 PM
        lateAfternoonEnd: parseInt(process.env.LATE_AFTERNOON_END) || 1380     // 11:00 PM
    },

    // API Configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'https://attendance-ngsx.onrender.com'
    }
};

