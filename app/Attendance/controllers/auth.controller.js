const db = require("../models");
const User = db.user;
const Image = db.image;
const Late = db.late;
const bcrypt = require("bcrypt");
const axios = require('axios');
const { sendWelcomeEmail, sendAccountDeletionEmail } = require('../utils/emailService');


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

    // Send welcome email (async, non-blocking)
    sendWelcomeEmail(email, name).catch(err => {
      console.error('Error sending welcome email:', err);
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

    // Send account deletion email (async, non-blocking)
    sendAccountDeletionEmail(email, name).catch(err => {
      console.error('Error sending deletion email:', err);
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

    // Optimize: Fetch all images in parallel using Promise.all
    const userEmails = users.map(user => user.email);
    const images = await Image.find({ email: { $in: userEmails } });
    
    // Create a map for O(1) lookup
    const imageMap = new Map();
    images.forEach(image => {
      imageMap.set(image.email, image.data);
    });

    // Create users with images using the map
    const usersWithImages = users.map(user => ({
      ...user.toObject(),
      image: imageMap.get(user.email) || ''
    }));

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
