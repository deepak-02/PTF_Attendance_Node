const controller = require("../controllers/leave.controller");
const express = require('express');

const router = express.Router();


// API to request leave
router.post('/requestLeave', controller.requestLeave);

// API to get all the leave requests
router.get('/getAll',controller.listLeaveRequests);

// API to get all the leave requests by status
router.get('/getByStatus/:requestStatus',controller.listLeaveRequestsByStatus);

// API to get the leave requests of a user by type
router.post('/getByType',controller.listUserLeaveRequestsByType);

// API to get requests of a single user by email and filter by status
router.post('/getByUser',controller.listUserLeaveRequests);

// API to approve or decline the leave request
router.post('/changeStatus', controller.changeLeaveStatus);


module.exports = router;