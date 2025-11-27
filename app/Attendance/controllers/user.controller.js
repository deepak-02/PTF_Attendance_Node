const db = require("../models");
const User = db.user;
const Image = db.image;
const Otp = db.otp;
const bcrypt = require("bcrypt");
const { sendPasswordResetOTP } = require('../utils/emailService');




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

    // Send OTP email
    const emailResult = await sendPasswordResetOTP(email, randomNumber.toString());
    
    if (!emailResult.success) {
        return res.status(500).json({ error: 'Error sending email' });
    }

    return res.status(200).json({ message: 'Email sent successfully' });
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