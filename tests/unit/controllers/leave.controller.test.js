const leaveController = require('../../../app/Attendance/controllers/leave.controller');
const db = require('../../../app/Attendance/models');
const { sendLeaveRequestToAdmin, sendLeaveStatusEmail } = require('../../../app/Attendance/utils/emailService');
const { sendPushNotification } = require('../../../app/Attendance/utils/pushNotificationService');

// Mock dependencies
jest.mock('../../../app/Attendance/models');
jest.mock('../../../app/Attendance/utils/emailService');
jest.mock('../../../app/Attendance/utils/pushNotificationService');

describe('Leave Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('requestLeave', () => {
    it('should create leave request successfully', async () => {
      req.body = {
        email: 'user@example.com',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        reason: 'Family emergency',
        type: 'casual',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLeave = {
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.leave.findOne.mockResolvedValue(null);
      db.leave.findOne.mockImplementationOnce(() => null).mockImplementationOnce(() => ({ leaveId: '0001' }));
      db.leave.mockImplementation(() => mockLeave);
      db.user.find.mockResolvedValue([
        { email: 'admin1@example.com' },
        { email: 'admin2@example.com' },
      ]);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLeaveRequestToAdmin.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await leaveController.requestLeave(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Leave request submitted successfully',
        })
      );
      expect(sendLeaveRequestToAdmin).toHaveBeenCalled();
    });

    it('should reject duplicate leave request', async () => {
      req.body = {
        email: 'user@example.com',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        reason: 'Family emergency',
        type: 'casual',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockExistingLeave = {
        email: 'user@example.com',
        requestDate: '2024-01-15',
        reason: 'Family emergency',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.leave.findOne.mockResolvedValue(mockExistingLeave);

      await leaveController.requestLeave(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Leave request already exists for the specified date and reason',
        })
      );
    });

    it('should return 400 for invalid user', async () => {
      req.body = {
        email: 'invalid@example.com',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        reason: 'Family emergency',
        type: 'casual',
      };

      db.user.findOne.mockResolvedValue(null);

      await leaveController.requestLeave(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user',
        })
      );
    });
  });

  describe('listLeaveRequests', () => {
    it('should list all leave requests', async () => {
      const mockLeaves = [
        {
          leaveId: '0001',
          email: 'user@example.com',
          requestDate: '2024-01-15',
          toDate: '2024-01-17',
          reason: 'Family emergency',
          type: 'casual',
          requestStatus: 'requested',
          requestedOn: '2024-01-10',
          approvedOrRejectedOn: '',
        },
      ];

      db.leave.find.mockResolvedValue(mockLeaves);
      db.user.findOne.mockResolvedValue({ name: 'John Doe' });

      await leaveController.listLeaveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          leaveRequests: expect.any(Array),
        })
      );
    });

    it('should return 404 when no leave requests found', async () => {
      db.leave.find.mockResolvedValue([]);

      await leaveController.listLeaveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('listLeaveRequestsByStatus', () => {
    it('should list leave requests by status', async () => {
      req.params.requestStatus = 'requested';

      const mockLeaves = [
        {
          leaveId: '0001',
          email: 'user@example.com',
          requestStatus: 'requested',
        },
      ];

      db.leave.find.mockResolvedValue(mockLeaves);
      db.user.findOne.mockResolvedValue({ name: 'John Doe' });

      await leaveController.listLeaveRequestsByStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(db.leave.find).toHaveBeenCalledWith({ requestStatus: 'requested' });
    });

    it('should reject invalid status', async () => {
      req.params.requestStatus = 'invalid-status';

      await leaveController.listLeaveRequestsByStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid requestStatus',
        })
      );
    });
  });

  describe('listUserLeaveRequests', () => {
    it('should list user leave requests', async () => {
      req.body = {
        email: 'user@example.com',
        status: 'all',
      };

      const mockLeaves = [
        {
          leaveId: '0001',
          email: 'user@example.com',
          requestStatus: 'requested',
        },
      ];

      db.leave.find.mockResolvedValue(mockLeaves);
      db.user.findOne.mockResolvedValue({ name: 'John Doe' });

      await leaveController.listUserLeaveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          leaveRequests: expect.any(Array),
        })
      );
    });

    it('should filter by status', async () => {
      req.body = {
        email: 'user@example.com',
        status: 'approved',
      };

      const mockLeaves = [
        {
          leaveId: '0001',
          email: 'user@example.com',
          requestStatus: 'approved',
        },
      ];

      db.leave.find.mockResolvedValue(mockLeaves);
      db.user.findOne.mockResolvedValue({ name: 'John Doe' });

      await leaveController.listUserLeaveRequests(req, res);

      expect(db.leave.find).toHaveBeenCalledWith({
        email: 'user@example.com',
        requestStatus: 'approved',
      });
    });
  });

  describe('changeLeaveStatus', () => {
    it('should approve leave request successfully', async () => {
      req.body = {
        email: 'user@example.com',
        leaveId: '0001',
        status: 'approved',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLeave = {
        email: 'user@example.com',
        leaveId: '0001',
        requestStatus: 'requested',
        reason: 'Family emergency',
        type: 'casual',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        requestedOn: '2024-01-10',
        approvedOrRejectedOn: '',
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.leave.findOne.mockResolvedValue(mockLeave);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLeaveStatusEmail.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await leaveController.changeLeaveStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLeave.requestStatus).toBe('approved');
      expect(mockLeave.save).toHaveBeenCalled();
      expect(sendLeaveStatusEmail).toHaveBeenCalled();
    });

    it('should reject leave request successfully', async () => {
      req.body = {
        email: 'user@example.com',
        leaveId: '0001',
        status: 'rejected',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLeave = {
        email: 'user@example.com',
        leaveId: '0001',
        requestStatus: 'requested',
        reason: 'Family emergency',
        type: 'casual',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        requestedOn: '2024-01-10',
        approvedOrRejectedOn: '',
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.leave.findOne.mockResolvedValue(mockLeave);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLeaveStatusEmail.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await leaveController.changeLeaveStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLeave.requestStatus).toBe('rejected');
    });

    it('should reject invalid status', async () => {
      req.body = {
        email: 'user@example.com',
        leaveId: '0001',
        status: 'invalid',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      db.user.findOne.mockResolvedValue(mockUser);

      await leaveController.changeLeaveStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid status',
        })
      );
    });

    it('should reject changing status of already processed request', async () => {
      req.body = {
        email: 'user@example.com',
        leaveId: '0001',
        status: 'approved',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLeave = {
        email: 'user@example.com',
        leaveId: '0001',
        requestStatus: 'approved', // Already approved
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.leave.findOne.mockResolvedValue(mockLeave);

      await leaveController.changeLeaveStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Leave request status cannot be changed',
        })
      );
    });
  });
});

