const controller = require("../controllers/auth.controller");
const express = require('express');
const router = express.Router();


// API to signup
router.route("/signup").post(controller.register);

// API to login
router.route("/login").post(controller.login);

// API to get all users
router.route("/get-all/:batchFilter").get(controller.getAllUsers);

// API to delete a user
router.route("/delete").post(controller.deleteUsers);

// API to delete a single user
router.route("/deleteMe/:email").get(controller.deleteUser);

// Test API Call
router.route("/test").post(controller.callTestApi);


module.exports = router