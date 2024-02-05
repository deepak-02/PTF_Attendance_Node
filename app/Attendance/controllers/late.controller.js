const db = require("../models");
const User = db.user;
const Notification = db.notification;
const Late = db.late;
const nodemailer = require('nodemailer');

const admin = require('firebase-admin');
// const serviceAccount = require('../attendance-dd5f2-firebase-adminsdk-eg6lr-27f3554625.json');


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });


// API to request late
exports.requestLate = async (req, res) => {
  try {
    const { email, reason, on, requestMethod } = req.body;
    console.log(req.body);
    var name = '';

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    name = user.name;

    

    // Check if the late request already exists for the specified date
    const existingLateRequest = await Late.findOne({ email, on });

    if (existingLateRequest) {
      return res.status(400).json({ message: 'Request already exists for the specified date' });
    }

const lateId = await generateLateId();

if(requestMethod == 'call'){
    // Create a new late request
    const newLateRequest = new Late({
      lateId,
      email,
      willLate: true,
      on,
      reason,
      status: 'approved',
      requestedOn: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      requestMethod
    });

    // Save the new Late request to the database
    await newLateRequest.save();



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
        subject: 'Late Request Status',
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <title>Late Request Approved</title>
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
    <div class="title">Late Approval - PTF Attendance App</div>
    <div class="content">Dear <b>${user.name}</b>,</div>
    <div class="content">Good news! Your late request from ${new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })} has been approved for the following details:</div>
    <div class="content">
      <strong>Reason :</strong> ${reason}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${on}
    </div>
    <div class="content">
      <strong>Status:</strong> Approved
    </div>

    <div class="footer">
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
        const notificationBody = `Your late request from ${new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} has been approved`;

        sendPushNotification(deviceToken, notificationTitle, notificationBody, 'lateUser');
      }



}else{
      // Create a new late request
    const newLateRequest = new Late({
      lateId,
      email,
      willLate: true,
      on,
      reason,
      status: 'requested',
      requestedOn: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      requestMethod
    });

    // Save the new Late request to the database
    await newLateRequest.save();

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
          subject: 'Late Request',
          html: `
        <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>Late Request</title>
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
      <div class="title">Late Request - PTF Attendance App</div>
      <div class="content">Dear Team,</div>
      <div class="content"> <b>${name}</b> want to request late approval for the following details:</div>
      <div class="content">
        <strong>Reason:</strong> ${reason}
      </div>
      <div class="content">
        <strong>Date Requested:</strong> ${on}
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

              const notificationTitle = 'Late Request';
              const notificationBody = `You have a new late request from ${name}`;

              sendPushNotification(deviceToken, notificationTitle, notificationBody, "lateAdmin");
            } else {
              console.error('Device token not available for user:', admins[i]);
            }

          } else {
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
}

    res.status(201).json({ message: 'Late request submitted successfully' });
  } catch (error) {
    console.error('Error requesting late approval:', error);
    res.status(500).json({ message: 'Failed to request late approval' });
  }
};

// API to approve or decline late request
exports.changeLateStatus = async (req, res) => {
  try {
    const { email, lateId, status } = req.body;

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

    // Find the Late request by ID
    const lateRequest = await Late.findOne({ email, lateId });

    if (!lateRequest) {
      return res.status(404).json({ message: 'Late request not found' });
    }

    // Check if the late request is in the 'requested' status
    if (lateRequest.status !== 'requested') {
      return res.status(400).json({ message: 'Late request status cannot be changed' });
    }

    // Update the late request status
    lateRequest.status = status;


    // Save the updated late request to the database
    await lateRequest.save();

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
        subject: 'Late Request Status',
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <title>Late Request Approved</title>
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
    <div class="title">Late Approval - PTF Attendance App</div>
    <div class="content">Dear <b>${name}</b>,</div>
    <div class="content">Good news! Your late request from ${lateRequest.requestedOn} has been approved for the following details:</div>
    <div class="content">
      <strong>Reason :</strong> ${lateRequest.reason}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${lateRequest.on}
    </div>
    <div class="content">
      <strong>Status:</strong> ${lateRequest.status}
    </div>

    <div class="footer">
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
        const notificationBody = `Your late request from ${lateRequest.requestedOn} has been approved`;

        sendPushNotification(deviceToken, notificationTitle, notificationBody, 'lateUser');
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
        subject: 'Late Request Status',
        html: `
  <!DOCTYPE html>
<html lang="en">
<head>
<title>Late Request Rejected</title>
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
    <div class="title">Late Request Rejection - PTF Attendance App</div>
    <div class="content">Dear <b>${name}</b>,</div>
    <div class="content">We regret to inform you that your late request has been rejected for the following details:</div>
    <div class="content">
      <strong>Reason :</strong> ${lateRequest.reason}
    </div>
    <div class="content">
      <strong>Date Requested:</strong> ${lateRequest.on}
    </div>
    <div class="content">
      <strong>Status:</strong> ${lateRequest.status}
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
      if (notification.token) {
        const deviceToken = notification.token; // Replace with the actual device token
        const notificationTitle = 'Rejected';
        const notificationBody = `Your late request from ${lateRequest.requestedOn} has been rejected`;

        sendPushNotification(deviceToken, notificationTitle, notificationBody, "user");
      }



    }

    res.status(200).json({ message: `Late request ${status === 'approved' ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    console.error('Error changing late request status:', error);
    res.status(500).json({ message: 'Failed to change late request status' });
  }
};

// Api to list late requests by email
exports.listByEmail = async (req, res) => {
  try {
    const { email, status } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    let lateRequests;

    if (status && status !== 'all') {
      const allowedStatusValues = ['approved', 'rejected', 'requested'];
      if (!allowedStatusValues.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      lateRequests = await Late.find({ email, status: status });
    } else {
      lateRequests = await Late.find({ email });
    }

    if (lateRequests.length === 0) {
      return res.status(404).json({ message: 'No late requests found' });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLateRequests = lateRequests.sort((a, b) => {
      const dateA = new Date(a.on);
      const dateB = new Date(b.on);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLateRequests = [];

    // Iterate through each late request and fetch user details
    for (const lateRequest of sortedLateRequests) {
      const user = await User.findOne({ email: lateRequest.email });

      const formattedRequest = {
        lateId: lateRequest.lateId,
        email: lateRequest.email,
        on: lateRequest.on,
        reason: lateRequest.reason,
        requestStatus: lateRequest.status,
        requestMethod: lateRequest.requestMethod,
        requestedOn: lateRequest.requestedOn,
        willLate: lateRequest.willLate,
        name: user ? user.name : '',
      };

      formattedLateRequests.push(formattedRequest);
    }

    res.status(200).json({ lateRequests: formattedLateRequests });



  } catch(error){
    console.error('Error listing:', error);
    res.status(500).json({ message: 'Failed to list' });
  }
};


// Api to list all late requests
exports.listAll = async (req, res) => {
  try {
    const { status } = req.body;

    let lateRequests;

    if (status && status !== 'all') {
      const allowedStatusValues = ['approved', 'rejected', 'requested'];
      if (!allowedStatusValues.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      lateRequests = await Late.find({ status: status });
    } else {
      lateRequests = await Late.find({});
    }

    if (lateRequests.length === 0) {
      return res.status(404).json({ message: 'No late requests found' });
    }

    // Convert the date strings to Date objects for proper sorting
    const sortedLateRequests = lateRequests.sort((a, b) => {
      const dateA = new Date(a.on);
      const dateB = new Date(b.on);

      return dateB - dateA;
    });

    // Create an array to store the formatted results
    const formattedLateRequests = [];

    // Iterate through each late request and fetch user details
    for (const lateRequest of sortedLateRequests) {
      const user = await User.findOne({ email: lateRequest.email });

      const formattedRequest = {
        lateId: lateRequest.lateId,
        email: lateRequest.email,
        on: lateRequest.on,
        reason: lateRequest.reason,
        requestStatus: lateRequest.status,
        requestMethod: lateRequest.requestMethod,
        requestedOn: lateRequest.requestedOn,
        willLate: lateRequest.willLate,
        name: user ? user.name : '',
      };

      formattedLateRequests.push(formattedRequest);
    }

    res.status(200).json({ lateRequests: formattedLateRequests });



  } catch(error){
    console.error('Error listing:', error);
    res.status(500).json({ message: 'Failed to list' });
  }
};













// Function to generate unique late ID
async function generateLateId() {
  const lastLate = await Late.findOne({}, {}, { sort: { lateId: -1 } });

  if (lastLate) {
    const lastId = parseInt(lastLate.lateId);
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
    if (deviceToken) {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
    } else {
      console.log("No token available");
    }

  } catch (error) {
    console.error('Error sending message:', error);
  }
}