const db = require("../models");
const Qr = db.qr;
const Attendance = db.attendance;
const User = db.user;

var resp = 0;

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
            const currentDate = new Date().toLocaleDateString('en-US');
            const attendanceEntry = await Attendance.findOne({ email, 'in.date': currentDate });

            if (attendanceEntry) {
                // If an attendance entry already exists, check the lastScan value
                console.log('aaaaaaaaaaaa');
                // if (lastScan === 'out' && attendanceEntry.lastScan === 'out') {
                //     return res.status(400).json({ message: 'You are already out' });
                // } else 
                if (lastScan === 'in' && attendanceEntry.lastScan === 'in') {
                    return res.status(202).json({ message: 'You are already in' });
                }else if(attendanceEntry.lastScan === 'out'){
                    return res.status(202).json({ message: 'Attendance already marked for the day' });
                } else {
                    // Update the lastScan field based on the current scan
                    attendanceEntry.lastScan = lastScan;

                    if (lastScan === 'out') {
                        attendanceEntry.out = {
                            date: currentDate,
                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        };
                    }

                    const currentTime = new Date();
                    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                    console.log('Current Minutes:', currentMinutes);

                    // Define the time ranges in minutes since midnight
                    const morningStart = 8 * 60 + 40;
                    const morningEnd = 13 * 60;
                    const afternoonStart = 13 * 60;
                    const afternoonEnd = 23 * 60;

                    if (
                        (currentMinutes >= morningStart && currentMinutes <= morningEnd) ||
                        (currentMinutes >= afternoonStart && currentMinutes <= afternoonEnd)
                    ) {
                        attendanceEntry.in.late = true;
                        console.log('Marked as late');
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
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        late: false, // Set the 'late' field based on your logic
                    },
                    out: {
                        date: '',
                        time: '',
                    },
                    lastScan: 'in',
                });

                const currentTime = new Date();
                const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                // Define the time ranges in minutes since midnight
                const morningStart = 8 * 60 + 40;
                const morningEnd = 13 * 60;
                const afternoonStart = 13 * 60;
                const afternoonEnd = 23 * 60;

                if ((currentMinutes >= morningStart && currentMinutes <= morningEnd) ||
                    (currentMinutes >= afternoonStart && currentMinutes <= afternoonEnd)) {
                    attendanceEntry.in.late = true;
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