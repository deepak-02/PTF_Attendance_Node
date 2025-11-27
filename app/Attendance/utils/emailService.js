const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

/**
 * Send email with error handling
 * @param {Object} mailOptions - Email options (to, subject, html)
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendEmail(mailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"PTF Attendance" <${config.email.user}>`,
            ...mailOptions
        });
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(email, name) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Account Created</title>
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
        <div class="title">Welcome to PTF Attendance App</div>
        <div class="content">Dear <b>${name}</b>,</div>
        <div class="content">Thank you for creating an account with the PTF Attendance App. We're excited to have you on board!</div>
        <div class="content">With our app, you can easily manage and track your attendance. If you have any questions or need assistance, feel free to reach out to our support team.</div>
        <div class="footer">
          Enjoy using PTF Attendance App!
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Welcome to PTF Attendance',
        html
    });
}

/**
 * Send account deletion email
 */
async function sendAccountDeletionEmail(email, name) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Account Deleted</title>
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
        <div class="title">PTF Attendance App - Account Deleted</div>
        <div class="content">Goodbye <b>${name}</b>,</div>
        <div class="content">Your account for the PTF Attendance App has been successfully deleted.</div>
        <div class="footer">
          We appreciate your time with us.
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Account Deleted',
        html
    });
}

/**
 * Send password reset OTP email
 */
async function sendPasswordResetOTP(email, otp) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>PTF Attendance App - Password Reset OTP</title>
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
        .otp {
          text-align: center;
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #1e80ff;
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
        <div class="title">PTF Attendance App - Password Reset OTP</div>
        <div class="content">Dear user,</div>
        <div class="content">You have requested to reset your password for the PTF Attendance App. Please use the following OTP to proceed:</div>
        <div class="otp">${otp}</div>
        <div class="content">This OTP will expire in 5 minutes, so please make sure to use it within that time.</div>
        <div class="footer">
          If you did not request this password reset, please ignore this email.
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Password Reset',
        html
    });
}

/**
 * Send leave request notification to admin
 */
async function sendLeaveRequestToAdmin(adminEmail, userName, reason, type, requestDate, toDate) {
    const html = `
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
        <div class="content"> <b>${userName}</b> wants to request leave for the following details:</div>
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
    `;

    return sendEmail({
        to: adminEmail,
        subject: 'Leave Request',
        html
    });
}

/**
 * Send leave approval/rejection email to user
 */
async function sendLeaveStatusEmail(email, name, status, leaveRequest) {
    const isApproved = status === 'approved';
    const title = isApproved ? 'Leave Approval - PTF Attendance App' : 'Leave Request Rejection - PTF Attendance App';
    const greeting = isApproved ? 'Good news!' : 'We regret to inform you';
    const action = isApproved ? 'approved' : 'rejected';
    const footerText = isApproved ? 'Enjoy your leave!' : 'We appreciate your understanding.';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${title}</title>
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
        <div class="title">${title}</div>
        <div class="content">Dear <b>${name}</b>,</div>
        <div class="content">${greeting}! Your leave request from ${leaveRequest.requestedOn} has been ${action} for the following details:</div>
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
        ${isApproved ? `<div class="content">
          <strong>Approved On:</strong> ${leaveRequest.approvedOrRejectedOn}
        </div>` : ''}
        <div class="footer">
          ${footerText}
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Leave Request Status',
        html
    });
}

/**
 * Send late request notification to admin
 */
async function sendLateRequestToAdmin(adminEmail, userName, reason, date) {
    const html = `
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
        <div class="content"> <b>${userName}</b> wants to request late approval for the following details:</div>
        <div class="content">
          <strong>Reason:</strong> ${reason}
        </div>
        <div class="content">
          <strong>Date Requested:</strong> ${date}
        </div>
        <div class="footer">
          Your prompt attention to this matter is greatly appreciated.
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: adminEmail,
        subject: 'Late Request',
        html
    });
}

/**
 * Send late approval/rejection email to user
 */
async function sendLateStatusEmail(email, name, status, lateRequest) {
    const isApproved = status === 'approved';
    const title = isApproved ? 'Late Approval - PTF Attendance App' : 'Late Request Rejection - PTF Attendance App';
    const greeting = isApproved ? 'Good news!' : 'We regret to inform you';
    const action = isApproved ? 'approved' : 'rejected';
    const footerText = isApproved ? '' : 'We appreciate your understanding.';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${title}</title>
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
        <div class="title">${title}</div>
        <div class="content">Dear <b>${name}</b>,</div>
        <div class="content">${greeting}! Your late request ${isApproved ? `from ${lateRequest.requestedOn}` : ''} has been ${action} for the following details:</div>
        <div class="content">
          <strong>Reason:</strong> ${lateRequest.reason}
        </div>
        <div class="content">
          <strong>Date Requested:</strong> ${lateRequest.on}
        </div>
        <div class="content">
          <strong>Status:</strong> ${lateRequest.status}
        </div>
        <div class="footer">
          ${footerText}
          <div class="footer-text">© PTF - 2022 Team</div>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: 'Late Request Status',
        html
    });
}

/**
 * Send late auto-approval email (for call method)
 */
async function sendLateAutoApprovalEmail(email, name, reason, date) {
    const html = `
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
        <div class="content">Good news! Your late request has been approved for the following details:</div>
        <div class="content">
          <strong>Reason:</strong> ${reason}
        </div>
        <div class="content">
          <strong>Date Requested:</strong> ${date}
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
    `;

    return sendEmail({
        to: email,
        subject: 'Late Request Status',
        html
    });
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendAccountDeletionEmail,
    sendPasswordResetOTP,
    sendLeaveRequestToAdmin,
    sendLeaveStatusEmail,
    sendLateRequestToAdmin,
    sendLateStatusEmail,
    sendLateAutoApprovalEmail
};

