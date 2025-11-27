const db = require("../models");
const User = db.user;
const Notification = db.notification;
const Late = db.late;
const { sendLateRequestToAdmin, sendLateStatusEmail, sendLateAutoApprovalEmail } = require('../utils/emailService');
const { sendPushNotification } = require('../utils/pushNotificationService');


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

    // Send auto-approval email (for call method)
    await sendLateAutoApprovalEmail(email, name, reason, on);

    // Send push notification
    const notification = await Notification.findOne({ email });
    if (notification && notification.token) {
      const requestedOn = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      await sendPushNotification(
        notification.token,
        'Approved',
        `Your late request from ${requestedOn} has been approved`,
        'lateUser'
      );
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

    // Get all admin users
    const admins = await User.find({ role: "admin" });

    // Send email and push notification to all admins
    if (admins && admins.length > 0) {
      for (const adminUser of admins) {
        try {
          // Send email to admin
          await sendLateRequestToAdmin(adminUser.email, name, reason, on);

          // Send push notification to admin
          const notification = await Notification.findOne({ email: adminUser.email });
          if (notification && notification.token) {
            await sendPushNotification(
              notification.token,
              'Late Request',
              `You have a new late request from ${name}`,
              "lateAdmin"
            );
          }
        } catch (error) {
          console.error(`Error sending notification to ${adminUser.email}:`, error);
          // Continue with other admins even if one fails
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
      // Send approval email
      await sendLateStatusEmail(email, name, 'approved', lateRequest);

      // Send push notification
      const notification = await Notification.findOne({ email });
      if (notification && notification.token) {
        await sendPushNotification(
          notification.token,
          'Approved',
          `Your late request from ${lateRequest.requestedOn} has been approved`,
          'lateUser'
        );
      }




    } else if (status == 'rejected') {
      // Send rejection email
      await sendLateStatusEmail(email, name, 'rejected', lateRequest);

      // Send push notification
      const notification = await Notification.findOne({ email });
      if (notification && notification.token) {
        await sendPushNotification(
          notification.token,
          'Rejected',
          `Your late request from ${lateRequest.requestedOn} has been rejected`,
          "lateUser"
        );
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
