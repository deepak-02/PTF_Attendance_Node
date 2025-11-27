const db = require("../models");
const Qr = db.qr;
const Attendance = db.attendance;
const User = db.user;
const Late = db.late;
const config = require('../config/config');

var resp = 0;

/**
 * Check if current time falls within late arrival windows
 * @returns {Number} - Current time in minutes from midnight
 */
function getCurrentMinutes() {
    const currentTimeString = new Date().toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false 
    });
    const currentHours = parseInt(currentTimeString.split(":")[0], 10);
    const currentMinute = parseInt(currentTimeString.split(":")[1], 10);
    return currentHours * 60 + currentMinute;
}

/**
 * Check if current time is within late arrival windows
 * @returns {Boolean} - True if time is within late windows
 */
function isLateTime() {
    const currentMinutes = getCurrentMinutes();
    return (
        (currentMinutes >= config.attendance.lateMorningStart && 
         currentMinutes <= config.attendance.lateMorningEnd) ||
        (currentMinutes >= config.attendance.lateAfternoonStart && 
         currentMinutes <= config.attendance.lateAfternoonEnd)
    );
}

// API to generate qr
exports.generate = async (req, res) => {
    try {
        console.log('called generate qr');

        resp = 0;

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const stringLength = Math.floor(Math.random() * 21) + 10;
        let generatedString = '';

        for (let i = 0; i < stringLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            generatedString += characters[randomIndex];
        }

        const qrString = `attendance-${generatedString}ptf`;

        const existingQR = await Qr.findOne();
        if (existingQR) {
            existingQR.qrString = qrString;
            await existingQR.save();
        } else {
            const qrDocument = new Qr({ qrString });
            await qrDocument.save();
        }

        res.status(200).json({ qrString });
    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ message: 'Failed to generate QR code' });
    }
};


// API to verify qr (marks attendance)
exports.verify = async (req, res) => {
    try {
        console.log('called verify qr');
        const { qrCode, email, lastScan } = req.body;
        const qrString = await Qr.findOne({ qrString: qrCode });

        if (qrString) {
            // Check if the user exists in the user schema
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: 'Invalid user' });
            }

            // Check if an attendance entry already exists for the current date and email
            const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
            const attendanceEntry = await Attendance.findOne({ email, 'in.date': currentDate });

            if (attendanceEntry) {
                // If an attendance entry already exists, check the lastScan value
                console.log('aaaaaaaaaaaa');
                // if (lastScan === 'out' && attendanceEntry.lastScan === 'out') {
                //     return res.status(400).json({ message: 'You are already out' });
                // } else 
                if (lastScan === 'in' && attendanceEntry.lastScan === 'in') {
                    return res.status(202).json({ message: 'You are already in' });
                } else if (attendanceEntry.lastScan === 'out') {
                    return res.status(202).json({ message: 'Attendance already marked for the day' });
                } else {
                    // Update the lastScan field based on the current scan
                    attendanceEntry.lastScan = lastScan;

                    if (lastScan === 'out') {
                        attendanceEntry.out = {
                            date: currentDate,
                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
                        };
                    }

                    // Check if time is within late windows
                    if (isLateTime()) {
                        const late = await Late.findOne({ email });
                        
                        if (!late) {
                            attendanceEntry.in.late = true;
                            console.log('Marked as late - no late request found');
                        } else {
                            // Check if approved late request exists for current date
                            const lateDate = new Date(late.on).toISOString().split('T')[0];
                            const currentDateISO = new Date(currentDate).toISOString().split('T')[0];
                            
                            if (late.status === "approved" && lateDate === currentDateISO) {
                                console.log("Approved late request found - not marking as late");
                            } else {
                                attendanceEntry.in.late = true;
                                console.log("Marked as late - no approved request for this date");
                            }
                        }
                    }

                    await attendanceEntry.save();


                }
            } else {
                // If it's the first entry for the day, mark the 'in' time and set lastScan as 'in'
                if (lastScan === 'out') {
                    return res.status(202).json({ message: 'Invalid operation. First entry must be IN.' });
                }
                console.log('bbbbbbbbbbbbb');

                const attendanceEntry = new Attendance({
                    email,
                    in: {
                        date: currentDate,
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
                        late: false, // Set the 'late' field based on your logic
                    },
                    out: {
                        date: '',
                        time: '',
                    },
                    lastScan: 'in',
                });


                // Check if time is within late windows
                if (isLateTime()) {
                    const late = await Late.findOne({ email });
                    
                    if (!late) {
                        attendanceEntry.in.late = true;
                        console.log("Marked as late - no late request found");
                    } else {
                        // Check if approved late request exists for current date
                        const lateDate = new Date(late.on).toISOString().split('T')[0];
                        const currentDateISO = new Date(currentDate).toISOString().split('T')[0];
                        
                        if (late.status === "approved" && lateDate === currentDateISO) {
                            console.log("Approved late request found - not marking as late");
                        } else {
                            attendanceEntry.in.late = true;
                            console.log("Marked as late - no approved request for this date");
                        }
                    }
                }

                await attendanceEntry.save();
            }

            resp = 100;

            await Qr.deleteOne({ _id: qrString._id }); // Remove the QR code from the database
            res.status(200).json({ message: 'QR verification successful' });
        } else {
            res.status(400).json({ message: 'QR verification failed' });
        }
    } catch (error) {
        console.error('Error verifying QR:', error);
        res.status(500).json({ message: 'Failed to verify QR code' });
    }
};



exports.resp = async (req, res) => {
    return res.status(200).json({ response: resp });
};

// await Qr.deleteOne({ _id: qrString._id });