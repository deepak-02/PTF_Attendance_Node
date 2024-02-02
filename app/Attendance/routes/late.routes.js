const controller = require("../controllers/late.controller");
const express = require('express');
const router = express.Router();


// API to request late approval
router.route("/request").post(controller.requestLate);

// API to change late approval status
router.route("/change").post(controller.changeLateStatus);

// API to get late approval by email and status
router.route("/getByEmail").post(controller.listByEmail);

// API to list all late requests
router.route("/getAll").post(controller.listAll);

module.exports = router;