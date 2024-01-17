const db = require("../models");
const Leave = db.leave;
const User = db.user;
const Notification = db.notification;
const nodemailer = require('nodemailer');

const admin = require('firebase-admin');
const serviceAccount = require('../attendance-dd5f2-firebase-adminsdk-eg6lr-27f3554625.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// API to request leave
exports.requestLeave = async (req, res) => {
  try {
    const { email, requestDate, toDate, reason, type } = req.body;

    var name = '';

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    name = user.name;
    // Generate unique userId
    const leaveId = await generateLeaveId();

    // Check if the leave request already exists for the specified date
    const existingLeaveRequest = await Leave.findOne({ email, requestDate, reason });

    if (existingLeaveRequest) {
      return res.status(400).json({ message: 'Leave request already exists for the specified date and reason' });
    }

    // Create a new leave request
    const newLeaveRequest = new Leave({
      leaveId,
      email,
      type,
      requestDate,
      toDate,
      reason,
      requestStatus: 'requested',
      requestedOn: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      approvedOrRejectedOn: ""
    });

    // Save the new leave request to the database
    await newLeaveRequest.save();


    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'ptfattendanceapp@gmail.com',
        pass: 'vkxhfuwbaygppaim',
      },
    });


    let admins = [];
    const admin = await User.find({ role: "admin" });

    if (admin) {
      for (let adm of admin) {
        admins.push(adm.email);
      }
      console.log(admins);

      for (let i = 0; i < admins.length; i++) {
        // setup email data with HTML body

        const mailOptions = {
          from: 'ptfattendanceapp@gmail.com',
          to: `${admins[i]}`,
          subject: 'Leave Request',
          html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <title>Leave Request</title>
  <style>
    body {
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    .container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .logo {
      text-align: center;
      margin-bottom: 20px;
    }

    .logo img {
      max-width: 150px;
    }

    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .content {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .footer {
      text-align: center;
      font-size: 14px;
      color: #808080;
      margin-top: 20px;
    }

    .footer-text {
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://i.postimg.cc/s2PRL37q/attendance-logo.png" alt="PTF Logo">   
    </div>
    <div class="title">Leave Request - PTF Attendance App</div>
    <div class="content">Dear Team,</div>
    <div class="content"> <b>${name}</b>, want to request leave for the following details:</div>
    <div class="content">
      <strong>Reason for Leave:</strong> ${reason}
    </div>
    <div class="content">
      <strong>Leave Type:</strong> ${type}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${requestDate}
    </div>
    <div class="content">
    <strong>Leave Until:</strong> ${toDate}
    </div>

    <div class="footer">
      Your prompt attention to this matter is greatly appreciated.
      <div class="footer-text">© PTF - 2022 Team</div>
    </div>
  </div>
</body>


</html>
    `,
        };

        try {
          const notification = await Notification.findOne({ 'email': admins[i] });
          if (notification) {
            console.log(notification);
            console.log(notification.email);
            console.log(notification.token);
             const deviceToken = notification.token; // Replace with the actual device token
            if (deviceToken) {
             
              const notificationTitle = 'Request';
              const notificationBody = `You have a new leave request from ${name}`;

              sendPushNotification(deviceToken, notificationTitle, notificationBody, "admin");
            }else {
              console.error('Device token not available for user:', admins[i]);
            }

          }else {
            console.error('Notification not found for user:', admins[i]);
          }



          // await the sendMail function to ensure it completes before moving to the next iteration
          // await transporter.sendMail(mailOptions);
          // send mail with defined transport object
          transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
              console.log(error);
              console.log(info);
              // return res.status(500).json({ error: 'Error sending email' });
            } else {
              // console.log('OTP saved');
              console.log(info);

              // return res.status(200).json({ message: 'Email sent successfully' });
            }
          });
          console.log(`Email sent to ${admins[i]}`);
        } catch (error) {
          console.error(`Error sending email to ${admins[i]}:`, error);
          // handle the error appropriately, for example, logging or responding to the client
        }
      }
    }




    // create reusable transporter object using the default SMTP transport
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: 'ptfattendanceapp@gmail.com',
    //     pass: 'vkxhfuwbaygppaim',
    //   },
    // });


    // setup email data with HTML body
    //     const mailOptions = {
    //       from: 'ptfattendanceapp@gmail.com',
    //       to: 'deepakck02@gmail.com',
    //       subject: 'Leave Request',
    //       html: `
    //       <!DOCTYPE html>
    // <html lang="en">
    // <head>
    //   <title>Leave Request</title>
    //   <style>
    //     body {
    //       background-color: #f5f5f5;
    //       font-family: Arial, sans-serif;
    //     }

    //     .container {
    //       max-width: 500px;
    //       margin: 0 auto;
    //       padding: 20px;
    //       background-color: #ffffff;
    //       border-radius: 5px;
    //       box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    //     }

    //     .logo {
    //       text-align: center;
    //       margin-bottom: 20px;
    //     }

    //     .logo img {
    //       max-width: 150px;
    //     }

    //     .title {
    //       text-align: center;
    //       font-size: 24px;
    //       font-weight: bold;
    //       margin-bottom: 20px;
    //     }

    //     .content {
    //       font-size: 16px;
    //       margin-bottom: 20px;
    //     }

    //     .footer {
    //       text-align: center;
    //       font-size: 14px;
    //       color: #808080;
    //       margin-top: 20px;
    //     }

    //     .footer-text {
    //       font-size: 12px;
    //     }
    //   </style>
    // </head>
    // <body>
    //   <div class="container">
    //     <div class="logo">
    //       <img src="https://i.postimg.cc/s2PRL37q/attendance-logo.png" alt="PTF Logo">   
    //     </div>
    //     <div class="title">Leave Request - PTF Attendance App</div>
    //     <div class="content">Dear Team,</div>
    //     <div class="content">I, <b>${name}</b>, want to request leave for the following details:</div>
    //     <div class="content">
    //       <strong>Reason for Leave:</strong> ${reason}
    //     </div>
    //     <div class="content">
    //       <strong>Leave Type:</strong> ${type}
    //     </div>
    //     <div class="content">
    //       <strong>Date Requested:</strong> ${requestDate}
    //     </div>
    //     <div class="content">
    //     <strong>Leave Until:</strong> ${toDate}
    //     </div>

    //     <div class="footer">
    //       Your prompt attention to this matter is greatly appreciated.
    //       <div class="footer-text">© PTF - 2022 Team</div>
    //     </div>
    //   </div>
    // </body>


    // </html>
    //     `,
    //     };

    // send mail with defined transport object
    // transporter.sendMail(mailOptions, async (error, info) => {
    //   if (error) {
    //     console.log(error);
    //     console.log(info);
    //     // return res.status(500).json({ error: 'Error sending email' });
    //   } else {
    //     // console.log('OTP saved');
    //     console.log(info);

    //     // return res.status(200).json({ message: 'Email sent successfully' });
    //   }
    // });




    // const adminEmail = "deepakck02@gmail.com";
    // const notification = await Notification.findOne({ 'email': adminEmail });

    // console.log(notification);
    // console.log(notification.email);
    // console.log(notification.token);

    // const deviceToken = notification.token; // Replace with the actual device token
    // const notificationTitle = 'Request';
    // const notificationBody = `You have a new leave request from ${name}`;

    // sendPushNotification(deviceToken, notificationTitle, notificationBody,"admin");



    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({ message: 'Failed to request leave' });
  }
};


// API to list all leave requests with user details
exports.listLeaveRequests = async (req, res) => {
  try {
    // Find all leave requests
    const leaveRequests = await Leave.find();

    if (leaveRequests.length === 0) {
      return res.status(404).json({ message: 'No leave requests found' });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLeaveRequests = leaveRequests.sort((a, b) => {
      const dateA = new Date(a.requestDate);
      const dateB = new Date(b.requestDate);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLeaveRequests = [];

    // Iterate through each leave request and fetch user details
    for (const leaveRequest of sortedLeaveRequests) {
      const user = await User.findOne({ email: leaveRequest.email });

      const formattedRequest = {
        leaveId: leaveRequest.leaveId,
        email: leaveRequest.email,
        requestDate: leaveRequest.requestDate,
        toDate: leaveRequest.toDate,
        type: leaveRequest.type,
        reason: leaveRequest.reason,
        requestStatus: leaveRequest.requestStatus,
        requestedOn: leaveRequest.requestedOn,
        approvedOrRejectedOn: leaveRequest.approvedOrRejectedOn,
        name: user ? user.name : '',
        phone: user ? user.phoneNumber : '',
        designation: user ? user.designation : '',
        batch: user ? user.batch : '',
        address: user ? user.address : '',
      };

      formattedLeaveRequests.push(formattedRequest);
    }

    res.status(200).json({ leaveRequests: formattedLeaveRequests });
  } catch (error) {
    console.error('Error listing leave requests:', error);
    res.status(500).json({ message: 'Failed to list leave requests' });
  }
};


// API to list leave requests by status with user details
exports.listLeaveRequestsByStatus = async (req, res) => {
  try {
    const { requestStatus } = req.params;

    // Validate requestStatus to ensure it's one of the allowed values
    const allowedStatusValues = ['requested', 'approved', 'rejected'];
    if (!allowedStatusValues.includes(requestStatus)) {
      return res.status(400).json({ message: 'Invalid requestStatus' });
    }

    // Find leave requests with the specified status
    const leaveRequests = await Leave.find({ requestStatus });

    if (leaveRequests.length === 0) {
      return res.status(404).json({ message: `No leave requests found with status ${requestStatus}` });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLeaveRequests = leaveRequests.sort((a, b) => {
      const dateA = new Date(a.requestedOn);
      const dateB = new Date(b.requestedOn);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLeaveRequests = [];

    // Iterate through each leave request and fetch user details
    for (const leaveRequest of sortedLeaveRequests) {
      const user = await User.findOne({ email: leaveRequest.email });

      const formattedRequest = {
        leaveId: leaveRequest.leaveId,
        email: leaveRequest.email,
        requestDate: leaveRequest.requestDate,
        toDate: leaveRequest.toDate,
        type: leaveRequest.type,
        reason: leaveRequest.reason,
        requestStatus: leaveRequest.requestStatus,
        requestedOn: leaveRequest.requestedOn,
        approvedOrRejectedOn: leaveRequest.approvedOrRejectedOn,
        name: user ? user.name : '',
        phone: user ? user.phoneNumber : '',
        designation: user ? user.designation : '',
        batch: user ? user.batch : '',
        address: user ? user.address : '',
      };

      formattedLeaveRequests.push(formattedRequest);
    }

    res.status(200).json({ leaveRequests: formattedLeaveRequests });
  } catch (error) {
    console.error('Error listing leave requests by status:', error);
    res.status(500).json({ message: 'Failed to list leave requests by status' });
  }
};


// API to list leave requests of a single user
exports.listUserLeaveRequests = async (req, res) => {
  try {
    const { email, status } = req.body;

    let leaveRequests;

    if (status && status !== 'all') {
      const allowedStatusValues = ['approved', 'rejected', 'requested'];
      if (!allowedStatusValues.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      leaveRequests = await Leave.find({ email, requestStatus: status });
    } else {
      leaveRequests = await Leave.find({ email });
    }

    if (leaveRequests.length === 0) {
      return res.status(404).json({ message: 'No leave requests found' });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLeaveRequests = leaveRequests.sort((a, b) => {
      const dateA = new Date(a.requestDate);
      const dateB = new Date(b.requestDate);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLeaveRequests = [];

    // Iterate through each leave request and fetch user details
    for (const leaveRequest of sortedLeaveRequests) {
      const user = await User.findOne({ email: leaveRequest.email });

      const formattedRequest = {
        leaveId: leaveRequest.leaveId,
        email: leaveRequest.email,
        requestDate: leaveRequest.requestDate,
        toDate: leaveRequest.toDate,
        type: leaveRequest.type,
        reason: leaveRequest.reason,
        requestStatus: leaveRequest.requestStatus,
        requestedOn: leaveRequest.requestedOn,
        approvedOrRejectedOn: leaveRequest.approvedOrRejectedOn,
        name: user ? user.name : '',
      };

      formattedLeaveRequests.push(formattedRequest);
    }

    res.status(200).json({ leaveRequests: formattedLeaveRequests });
  } catch (error) {
    console.error('Error listing leave requests:', error);
    res.status(500).json({ message: 'Failed to list leave requests' });
  }
};

// API to list leave requests of a single user by type
exports.listUserLeaveRequestsByType = async (req, res) => {
  try {
    const { email, type } = req.body;

    let leaveRequests;

    if (type !== 'all') {
      const allowedTypeValues = ['casual', 'sick'];
      if (!allowedTypeValues.includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
      }
      leaveRequests = await Leave.find({ email, type: type });
    } else {
      leaveRequests = await Leave.find({ email });
    }

    if (leaveRequests.length === 0) {
      return res.status(404).json({ message: 'No leave requests found' });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLeaveRequests = leaveRequests.sort((a, b) => {
      const dateA = new Date(a.requestDate);
      const dateB = new Date(b.requestDate);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLeaveRequests = [];

    // Iterate through each leave request and fetch user details
    for (const leaveRequest of sortedLeaveRequests) {
      const user = await User.findOne({ email: leaveRequest.email });

      const formattedRequest = {
        leaveId: leaveRequest.leaveId,
        email: leaveRequest.email,
        requestDate: leaveRequest.requestDate,
        toDate: leaveRequest.toDate,
        type: leaveRequest.type,
        reason: leaveRequest.reason,
        requestStatus: leaveRequest.requestStatus,
        requestedOn: leaveRequest.requestedOn,
        approvedOrRejectedOn: leaveRequest.approvedOrRejectedOn,
        name: user ? user.name : '',
      };

      formattedLeaveRequests.push(formattedRequest);
    }

    res.status(200).json({ leaveRequests: formattedLeaveRequests });
  } catch (error) {
    console.error('Error listing leave requests:', error);
    res.status(500).json({ message: 'Failed to list leave requests' });
  }
};


// API to approve or decline leave request
exports.changeLeaveStatus = async (req, res) => {
  try {
    const { email, leaveId, status } = req.body;

    var name = '';


    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    name = user.name;

    // Validate status to ensure it's one of the allowed values
    const allowedStatusValues = ['approved', 'rejected'];
    if (!allowedStatusValues.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the leave request by ID
    const leaveRequest = await Leave.findOne({ email, leaveId });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if the leave request is in the 'requested' status
    if (leaveRequest.requestStatus !== 'requested') {
      return res.status(400).json({ message: 'Leave request status cannot be changed' });
    }

    // Update the leave request status and set the time of approval or rejection
    leaveRequest.requestStatus = status;
    leaveRequest.approvedOrRejectedOn = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Save the updated leave request to the database
    await leaveRequest.save();

    if (status == 'approved') {

      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'ptfattendanceapp@gmail.com',
          pass: 'vkxhfuwbaygppaim',
        },
      });

      // setup email data with HTML body
      const mailOptions = {
        from: 'ptfattendanceapp@gmail.com',
        to: email,
        subject: 'Leave Request Status',
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <title>Leave Request Approved</title>
  <style>
    body {
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    .container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .logo {
      text-align: center;
      margin-bottom: 20px;
    }

    .logo img {
      max-width: 150px;
    }

    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .content {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .footer {
      text-align: center;
      font-size: 14px;
      color: #808080;
      margin-top: 20px;
    }

    .footer-text {
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://i.postimg.cc/s2PRL37q/attendance-logo.png" alt="PTF Logo">   
    </div>
    <div class="title">Leave Approval - PTF Attendance App</div>
    <div class="content">Dear <b>${name}</b>,</div>
    <div class="content">Good news! Your leave request from ${leaveRequest.requestedOn} has been approved for the following details:</div>
    <div class="content">
      <strong>Reason for Leave:</strong> ${leaveRequest.reason}
    </div>
    <div class="content">
      <strong>Leave Type:</strong> ${leaveRequest.type}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${leaveRequest.requestDate}
    </div>
    <div class="content">
      <strong>Leave Until:</strong> ${leaveRequest.toDate}
    </div>
    <div class="content">
      <strong>Approved On:</strong> ${leaveRequest.approvedOrRejectedOn}
    </div>

    <div class="footer">
      Enjoy your leave!
      <div class="footer-text">© PTF - 2022 Team</div>
    </div>
  </div>
</body>
</html>
    `,
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error);
          console.log(info);
          // return res.status(500).json({ error: 'Error sending email' });
        } else {
          // console.log('OTP saved');
          console.log(info);

          // return res.status(200).json({ message: 'Email sent successfully' });
        }
      });


      //get token for user from the db and send notification
      const notification = await Notification.findOne({ 'email': email });
      if (notification) {
        const deviceToken = notification.token; // Replace with the actual device token
        const notificationTitle = 'Approved';
        const notificationBody = `Your leave request from ${leaveRequest.requestedOn} has been approved`;

        sendPushNotification(deviceToken, notificationTitle, notificationBody, 'user');
      }




    } else if (status == 'rejected') {
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'ptfattendanceapp@gmail.com',
          pass: 'vkxhfuwbaygppaim',
        },
      });

      // setup email data with HTML body
      const mailOptions = {
        from: 'ptfattendanceapp@gmail.com',
        to: email,
        subject: 'Leave Request Status',
        html: `
  <!DOCTYPE html>
<html lang="en">
<head>
<title>Leave Request Rejected</title>
<style>
body {
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.logo {
  text-align: center;
  margin-bottom: 20px;
}

.logo img {
  max-width: 150px;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.content {
  font-size: 16px;
  margin-bottom: 20px;
}

.footer {
  text-align: center;
  font-size: 14px;
  color: #808080;
  margin-top: 20px;
}

.footer-text {
  font-size: 12px;
}
</style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://i.postimg.cc/s2PRL37q/attendance-logo.png" alt="PTF Logo">   
    </div>
    <div class="title">Leave Request Rejection - PTF Attendance App</div>
    <div class="content">Dear <b>${name}</b>,</div>
    <div class="content">We regret to inform you that your leave request has been rejected for the following details:</div>
    <div class="content">
      <strong>Reason for Leave:</strong> ${leaveRequest.reason}
    </div>
    <div class="content">
      <strong>Leave Type:</strong> ${leaveRequest.type}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${leaveRequest.requestDate}
    </div>
    <div class="content">
      <strong>Leave Until:</strong> ${leaveRequest.toDate}
    </div>

    <div class="footer">
      We appreciate your understanding.
      <div class="footer-text">© PTF - 2022 Team</div>
    </div>
  </div>
</body>

</html>
`,
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error);
          console.log(info);
          // return res.status(500).json({ error: 'Error sending email' });
        } else {
          // console.log('OTP saved');
          console.log(info);

          // return res.status(200).json({ message: 'Email sent successfully' });
        }
      });



      const notification = await Notification.findOne({ 'email': email });
      if (notification) {
        const deviceToken = notification.token; // Replace with the actual device token
        const notificationTitle = 'Rejected';
        const notificationBody = `Your leave request from ${leaveRequest.requestedOn} has been rejectes`;

        sendPushNotification(deviceToken, notificationTitle, notificationBody, "user");
      }



    }

    res.status(200).json({ message: `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    console.error('Error changing leave request status:', error);
    res.status(500).json({ message: 'Failed to change leave request status' });
  }
};


exports.sendNoti = async (req, res) => {
  try {
    const { email } = req.body;

    const notification = await Notification.findOne({ 'email': email });
    if (notification) {
      const deviceToken = notification.token;
      const notificationTitle = 'Approved';
      const notificationBody = `Your leave request has been approved`;

      sendPushNotification(deviceToken, notificationTitle, notificationBody, 'user');

      res.status(200).json({ message: 'Notification Send' });
    } else {
      res.status(400).json({ message: 'Not found' });
    }



  } catch (e) {
    res.status(500).json({ message: e.toString });
  }
}



// Function to generate unique leave ID
async function generateLeaveId() {
  const lastLeave = await Leave.findOne({}, {}, { sort: { leaveId: -1 } });

  if (lastLeave) {
    const lastId = parseInt(lastLeave.leaveId);
    return (lastId + 1).toString().padStart(4, "0");
  }

  return "0001";
}






// Function to send a push notification
async function sendPushNotification(deviceToken, title, body, data) {
  const message = {
    data: {
      "click": data,
    },
    notification: {
      title: title,
      body: body,
    },
    token: deviceToken,
  };

  try {
    if(deviceToken){
      const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    }else{
      console.log("No token available");
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
  }
}


