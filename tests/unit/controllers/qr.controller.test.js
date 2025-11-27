const qrController = require('../../../app/Attendance/controllers/qr.controller');
const db = require('../../../app/Attendance/models');
const config = require('../../../app/Attendance/config/config');

// Mock dependencies
jest.mock('../../../app/Attendance/models');
jest.mock('../../../app/Attendance/config/config');

describe('QR Controller', () => {
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

  describe('generate', () => {
    it('should generate QR code successfully', async () => {
      const mockQR = {
        qrString: 'old-qr',
        save: jest.fn().mockResolvedValue(true),
      };

      db.qr.findOne.mockResolvedValue(mockQR);

      await qrController.generate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          qrString: expect.stringContaining('attendance-'),
        })
      );
      expect(mockQR.save).toHaveBeenCalled();
    });

    it('should create new QR if none exists', async () => {
      const mockQR = {
        save: jest.fn().mockResolvedValue(true),
      };

      db.qr.findOne.mockResolvedValue(null);
      db.qr.mockImplementation(() => mockQR);

      await qrController.generate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('verify', () => {
    beforeEach(() => {
      config.attendance = {
        lateMorningStart: 580,
        lateMorningEnd: 720,
        lateAfternoonStart: 820,
        lateAfternoonEnd: 1380,
      };
    });

    it('should mark attendance IN successfully', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'in',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };
      const mockAttendance = {
        save: jest.fn().mockResolvedValue(true),
        in: { date: new Date(), time: '09:00', late: false },
        lastScan: 'in',
      };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(null);
      db.attendance.mockImplementation(() => mockAttendance);
      db.late.findOne.mockResolvedValue(null);
      db.qr.deleteOne.mockResolvedValue(true);

      // Mock Date to return a time outside late windows
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('08:00:00');

      await qrController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'QR verification successful',
        })
      );
      expect(db.qr.deleteOne).toHaveBeenCalled();
    });

    it('should mark attendance OUT successfully', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'out',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };
      const mockAttendance = {
        in: { date: new Date(), time: '09:00', late: false },
        lastScan: 'in',
        out: {},
        save: jest.fn().mockResolvedValue(true),
      };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(mockAttendance);
      db.qr.deleteOne.mockResolvedValue(true);

      await qrController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockAttendance.lastScan).toBe('out');
      expect(mockAttendance.save).toHaveBeenCalled();
    });

    it('should reject invalid QR code', async () => {
      req.body = {
        qrCode: 'invalid-qr',
        email: 'user@example.com',
        lastScan: 'in',
      };

      db.qr.findOne.mockResolvedValue(null);

      await qrController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'QR verification failed',
        })
      );
    });

    it('should reject OUT scan when already OUT', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'out',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };
      const mockAttendance = {
        in: { date: new Date(), time: '09:00' },
        lastScan: 'out',
      };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(mockAttendance);

      await qrController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Attendance already marked for the day',
        })
      );
    });

    it('should reject OUT scan when no IN scan exists', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'out',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(null);

      await qrController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid operation. First entry must be IN.',
        })
      );
    });

    it('should mark as late when time is in late window', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'in',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };
      const mockAttendance = {
        in: { date: new Date(), time: '10:00', late: false },
        lastScan: 'in',
        save: jest.fn().mockResolvedValue(true),
      };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(null);
      db.attendance.mockImplementation(() => mockAttendance);
      db.late.findOne.mockResolvedValue(null);
      db.qr.deleteOne.mockResolvedValue(true);

      // Mock time to be 10:00 AM (within late window)
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:00:00');

      await qrController.verify(req, res);

      expect(mockAttendance.in.late).toBe(true);
    });

    it('should not mark as late when approved late request exists', async () => {
      req.body = {
        qrCode: 'attendance-test123ptf',
        email: 'user@example.com',
        lastScan: 'in',
      };

      const mockQR = { _id: 'qr-id', qrString: 'attendance-test123ptf' };
      const mockUser = { email: 'user@example.com' };
      const mockAttendance = {
        in: { date: new Date(), time: '10:00', late: false },
        lastScan: 'in',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockLate = {
        on: new Date(),
        status: 'approved',
      };

      db.qr.findOne.mockResolvedValue(mockQR);
      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.findOne.mockResolvedValue(null);
      db.attendance.mockImplementation(() => mockAttendance);
      db.late.findOne.mockResolvedValue(mockLate);
      db.qr.deleteOne.mockResolvedValue(true);

      // Mock time to be 10:00 AM
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:00:00');

      await qrController.verify(req, res);

      // Should not be marked as late due to approved request
      expect(mockAttendance.in.late).toBe(false);
    });
  });

  describe('resp', () => {
    it('should return response status', async () => {
      qrController.resp = 100;

      await qrController.resp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          response: 100,
        })
      );
    });
  });
});

