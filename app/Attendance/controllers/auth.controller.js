const db = require("../models");
const User = db.user;
const Image = db.image;
const Late = db.late;
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const axios = require('axios');


// API for user registration
exports.register = async (req, res) => {
  try {
    console.log('called register');

    const { name, email, password, address, phoneNumber, batch, designation, role } = req.body;

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password should be at least 8 characters long' });
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'User with the same email already exists' });
    }

    // Generate unique userId
    const userId = await generateUserId();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userId,
      name,
      email,
      password: hashedPassword,
      address,
      phoneNumber,
      batch,
      designation,
      role,
    });

    await newUser.save();


    // Send account created message

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
      subject: 'Welcome to PTF Attendance',
      html: `
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

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// API for user login
exports.login = async (req, res) => {
  try {
    console.log('called login');

    const { email, password } = req.body;

    // Validate email format
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password should be at least 8 characters long' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate and sign a JWT token
    // const token = jwt.sign({ userId: user.userId, role: user.role }, 'secret-key');

    res.status(200).json({ message: 'Login successful', role: user.role, name: user.name, batch: user.batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// API to delete users 
exports.deleteUsers = async (req, res) => {
  try {
    console.log('called delete users');

    const { userIds } = req.body;

    // Find users with the provided userIds
    const users = await User.find({ userId: { $in: userIds } });

    // Create arrays to store the IDs of deleted and not found users
    const deletedUserIds = [];
    const notFoundUserIds = [];

    // Iterate through the requested userIds and delete the corresponding users
    for (const userId of userIds) {
      const user = users.find(u => u.userId === userId);

      if (!user) {
        // User not found
        notFoundUserIds.push(userId);
      } else {
        // Delete the user
        await User.findByIdAndDelete(user._id);
        deletedUserIds.push(userId);
      }
    }

    // Prepare the response object
    const response = {
      deletedUserIds,
      notFoundUserIds
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// API to delete a single user
exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.params;

    var name = '';

    // Find the user with the provided email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    name = user.name;

    // Delete the user
    await User.findByIdAndDelete(user._id);

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
      subject: 'Account Deleted',
      html: `
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


    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// API to get all users
exports.getAllUsers = async (req, res) => {
  try {
    console.log('called get all users');

    const { batchFilter } = req.params;
    let filter = {};

    if (batchFilter && batchFilter != "All") {

      filter = { batch: batchFilter };

    }

    // { batch: "Batch 1" }
    // Find all users excluding the password


    const users = await User.find(filter, { password: 0 });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Create an array to store the users with images
    const usersWithImages = [];

    // Iterate through each user and fetch the associated image
    for (const user of users) {
      // Find the image for the user
      const image = await Image.findOne({ email: user.email });

      // Create a user object with the image data
      const userWithImage = {
        ...user.toObject(),
        image: image ? image.data : '', // Add the image data to the user object
      };

      usersWithImages.push(userWithImage);
    }

    res.status(200).json(usersWithImages);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Failed to get all users' });
  }
};


exports.callTestApi = async (req, res) => {
  try {
    console.log("calling test api...");
    const { email } = req.body;
    const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const late = await Late.findOne({ email });

    // Format the date to the desired format (month/day/year)
    const formattedDate = new Date(late.on).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log(formattedDate);

    console.log(currentDate);
    console.log(late.on);
    console.log(new Date(currentDate).toISOString().split('T')[0] === late.on.toISOString().split('T')[0]);


    res.status(200).json();
  } catch (error) {
    console.error('Error making API call:', error.message);
    res.status(500).json({ message: `Error making API call:, ${error.message}` });
  }
};


// Function to generate unique user ID
async function generateUserId() {
  const lastUser = await User.findOne({}, {}, { sort: { userId: -1 } });

  if (lastUser) {
    const lastId = parseInt(lastUser.userId);
    return (lastId + 1).toString().padStart(4, "0");
  }

  return "0001";
}
