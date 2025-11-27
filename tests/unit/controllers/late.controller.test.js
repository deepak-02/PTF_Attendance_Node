const lateController = require('../../../app/Attendance/controllers/late.controller');
const db = require('../../../app/Attendance/models');
const { sendLateRequestToAdmin, sendLateStatusEmail, sendLateAutoApprovalEmail } = require('../../../app/Attendance/utils/emailService');
const { sendPushNotification } = require('../../../app/Attendance/utils/pushNotificationService');

// Mock dependencies
jest.mock('../../../app/Attendance/models');
jest.mock('../../../app/Attendance/utils/emailService');
jest.mock('../../../app/Attendance/utils/pushNotificationService');

describe('Late Controller', () => {
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

  describe('requestLate', () => {
    it('should create late request with call method (auto-approved)', async () => {
      req.body = {
        email: 'user@example.com',
        reason: 'Traffic jam',
        on: '2024-01-15',
        requestMethod: 'call',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLate = {
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.findOne.mockResolvedValue(null);
      db.late.findOne.mockImplementationOnce(() => null).mockImplementationOnce(() => ({ lateId: '0001' }));
      db.late.mockImplementation(() => mockLate);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLateAutoApprovalEmail.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await lateController.requestLate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLate.status).toBe('approved');
      expect(sendLateAutoApprovalEmail).toHaveBeenCalled();
    });

    it('should create late request with app method (requires approval)', async () => {
      req.body = {
        email: 'user@example.com',
        reason: 'Traffic jam',
        on: '2024-01-15',
        requestMethod: 'app',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLate = {
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.findOne.mockResolvedValue(null);
      db.late.findOne.mockImplementationOnce(() => null).mockImplementationOnce(() => ({ lateId: '0001' }));
      db.late.mockImplementation(() => mockLate);
      db.user.find.mockResolvedValue([
        { email: 'admin1@example.com' },
      ]);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLateRequestToAdmin.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await lateController.requestLate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLate.status).toBe('requested');
      expect(sendLateRequestToAdmin).toHaveBeenCalled();
    });

    it('should reject duplicate late request', async () => {
      req.body = {
        email: 'user@example.com',
        reason: 'Traffic jam',
        on: '2024-01-15',
        requestMethod: 'app',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockExistingLate = {
        email: 'user@example.com',
        on: new Date('2024-01-15'),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.findOne.mockResolvedValue(mockExistingLate);

      await lateController.requestLate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request already exists for the specified date',
        })
      );
    });
  });

  describe('changeLateStatus', () => {
    it('should approve late request successfully', async () => {
      req.body = {
        email: 'user@example.com',
        lateId: '0001',
        status: 'approved',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLate = {
        email: 'user@example.com',
        lateId: '0001',
        status: 'requested',
        reason: 'Traffic jam',
        on: new Date('2024-01-15'),
        requestedOn: '2024-01-15 08:00 AM',
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.findOne.mockResolvedValue(mockLate);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLateStatusEmail.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await lateController.changeLateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLate.status).toBe('approved');
      expect(mockLate.save).toHaveBeenCalled();
      expect(sendLateStatusEmail).toHaveBeenCalled();
    });

    it('should reject late request successfully', async () => {
      req.body = {
        email: 'user@example.com',
        lateId: '0001',
        status: 'rejected',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLate = {
        email: 'user@example.com',
        lateId: '0001',
        status: 'requested',
        reason: 'Traffic jam',
        on: new Date('2024-01-15'),
        requestedOn: '2024-01-15 08:00 AM',
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.findOne.mockResolvedValue(mockLate);
      db.notification.findOne.mockResolvedValue({ token: 'fcm-token' });
      sendLateStatusEmail.mockResolvedValue({ success: true });
      sendPushNotification.mockResolvedValue({ success: true });

      await lateController.changeLateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockLate.status).toBe('rejected');
    });

    it('should reject invalid status', async () => {
      req.body = {
        email: 'user@example.com',
        lateId: '0001',
        status: 'invalid',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      db.user.findOne.mockResolvedValue(mockUser);

      await lateController.changeLateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listByEmail', () => {
    it('should list late requests by email', async () => {
      req.body = {
        email: 'user@example.com',
        status: 'all',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockLates = [
        {
          lateId: '0001',
          email: 'user@example.com',
          on: new Date('2024-01-15'),
          reason: 'Traffic jam',
          status: 'requested',
          requestMethod: 'app',
          requestedOn: '2024-01-15 08:00 AM',
          willLate: true,
        },
      ];

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.find.mockResolvedValue(mockLates);
      db.user.findOne.mockResolvedValue(mockUser);

      await lateController.listByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lateRequests: expect.any(Array),
        })
      );
    });

    it('should filter by status', async () => {
      req.body = {
        email: 'user@example.com',
        status: 'approved',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.late.find.mockResolvedValue([]);

      await lateController.listByEmail(req, res);

      expect(db.late.find).toHaveBeenCalledWith({
        email: 'user@example.com',
        status: 'approved',
      });
    });
  });

  describe('listAll', () => {
    it('should list all late requests', async () => {
      req.body = {
        status: 'all',
      };

      const mockLates = [
        {
          lateId: '0001',
          email: 'user@example.com',
          on: new Date('2024-01-15'),
          reason: 'Traffic jam',
          status: 'requested',
        },
      ];

      db.late.find.mockResolvedValue(mockLates);
      db.user.findOne.mockResolvedValue({ name: 'John Doe' });

      await lateController.listAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lateRequests: expect.any(Array),
        })
      );
    });
  });
});

