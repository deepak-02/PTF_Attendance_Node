const db = require("../models");
const nodemailer = require('nodemailer');
const User = db.user;
const Image = db.image;
const Otp = db.otp;
const bcrypt = require("bcrypt");




//API to get a single user
exports.getUser = async (req, res) => {
    try {
        console.log('called get user');
        const { email } = req.params;

        const user = await User.findOne({ email }, { password: 0 });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API to upload image
exports.uploadImage = async (req, res) => {
    try {
        console.log('called upload image');

        const { email } = req.body;
        const data = req.file.buffer.toString('base64'); // Convert the image buffer to base64 encoded string

        // Find existing image by email
        let existingImage = await Image.findOne({ email });

        if (existingImage) {
            // If an image with the same email exists, replace it with the new image data
            existingImage.data = data;
            await existingImage.save();
        } else {
            // If no existing image found, create a new one
            const newImage = new Image({
                email,
                data
            });
            await newImage.save();
        }

        res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Api to get the image with email
exports.getImageByEmail = async (req, res) => {
    try {
        console.log('called get image by email');

        const { email } = req.body;

        const image = await Image.findOne({ email });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ image });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API to delete image by email
exports.deleteImage = async (req, res) => {
    try {
        console.log('called delete image');

        const { email } = req.params;

        // Validate if email is provided
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find the image by email
        const image = await Image.findOne({ email });

        if (!image) {
            return res.status(404).json({ message: 'Image not found for the provided email' });
        }

        // Delete the image
        await Image.deleteOne({ email });

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Failed to delete image' });
    }
};


// API to update user details
exports.updateUser = async (req, res) => {
    try {
        console.log('called update user');

        const { email, name, address, phoneNumber, batch, designation } = req.body;

        const updatedUser = await User.findOneAndUpdate(
            { email }, // Find the user by email
            {
                name,
                address,
                phoneNumber,
                batch,
                designation
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API to get OTP
exports.getOtp = async (req, res) => {
    try {
    const email = req.body.email;
    const randomNumber = Math.floor(Math.random() * 10000);

    // Input validation
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

       // Delete existing OTP for the user
        await Otp.deleteOne({ email: email });

// Create new OTP
        await Otp.create({
            email: email,
            otp: randomNumber.toString(),
        });

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
        subject: 'Password Reset',
        html: `
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
    <div class="otp">${randomNumber}</div>
    <div class="content">This OTP will expire in 5 minutes, so please make sure to use it within that time.</div>
    <div class="footer">
      If you did not request this password reset, please ignore this email.
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
            return res.status(500).json({ error: 'Error sending email' });
        } else {
            console.log('OTP saved');
            console.log(info);

            return res.status(200).json({ message: 'Email sent successfully' });
        }
    });
    } catch (error) {
        console.error('Error generating OTP:', error);
        return res.status(500).json({ message: error.message });
    }
};

// API to verify OTP
exports.verifyOtp = async (req, res) => {
    try{
        const {email,otp}=req.body;
        console.log("Verify OTP");
        console.log({email,otp});

        // Input validation
        if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const verify= await Otp.findOne({email:email,otp:otp.toString()})

        if(verify){
            await Otp.deleteOne({ email: email, otp: otp.toString() });
            return res.status(200).json({message:"otp verified"});
        }
        else {
            return res.status(202).json({message:"invalid otp"});
        }
        //  console.log("verify........")
        // console.log(verify);
    } catch (error) {
       return res.status(500).json({ message: error.message });
    }

};

// API to reset password
exports.resetPassword = async (req, res) => {
    const { email, password } = req.body;
    console.log("body",{ email, password })
    try {
        // Find the user with the given email
        const user = await User.findOne({ email:email });

        // If the user is not found, return an error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password should be at least 8 characters long' });
        }

        // Hash the new password
        // Update the user's password in the database
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        // Return a success message
        return res.status(200).json({message:"Password resetted successfully"});
    } catch (err) {
        console.error(err);
       return  res.status(500).json({ message: err.message });
    }
}