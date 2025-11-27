const attendanceController = require('../../../app/Attendance/controllers/attendance.controller');
const db = require('../../../app/Attendance/models');

// Mock dependencies
jest.mock('../../../app/Attendance/models');

describe('Attendance Controller', () => {
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

  describe('listAttendances', () => {
    it('should list attendances for a user', async () => {
      req.params.email = 'user@example.com';

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockAttendances = [
        {
          email: 'user@example.com',
          in: { date: new Date('2024-01-15'), time: '09:00', late: false },
          out: { date: new Date('2024-01-15'), time: '18:00' },
          lastScan: 'out',
          toObject: function() {
            return {
              email: this.email,
              in: this.in,
              out: this.out,
              lastScan: this.lastScan,
            };
          },
        },
      ];

      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.find.mockResolvedValue(mockAttendances);

      await attendanceController.listAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          attendances: expect.any(Array),
        })
      );
    });

    it('should return 400 for invalid user', async () => {
      req.params.email = 'invalid@example.com';

      db.user.findOne.mockResolvedValue(null);

      await attendanceController.listAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user',
        })
      );
    });

    it('should return 404 when no attendances found', async () => {
      req.params.email = 'user@example.com';

      const mockUser = {
        email: 'user@example.com',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.attendance.find.mockResolvedValue([]);

      await attendanceController.listAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('listAttendancesByDate', () => {
    it('should list attendances by date', async () => {
      req.body = {
        date: '1/15/2024',
        batch: 'Batch 1',
      };

      const mockUsers = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
      ];

      const mockAttendances = [
        {
          email: 'user1@example.com',
          in: { date: new Date('2024-01-15'), time: '09:00' },
          out: { date: new Date('2024-01-15'), time: '18:00' },
          toObject: function() {
            return {
              email: this.email,
              in: this.in,
              out: this.out,
            };
          },
        },
      ];

      db.user.find.mockResolvedValue(mockUsers);
      db.attendance.find.mockResolvedValue(mockAttendances);
      db.user.findOne.mockResolvedValue({ name: 'User 1' });
      db.image.findOne.mockResolvedValue({ data: 'image-data' });

      await attendanceController.listAttendancesByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          attendances: expect.any(Array),
        })
      );
    });

    it('should filter by batch when provided', async () => {
      req.body = {
        date: '1/15/2024',
        batch: 'Batch 1',
      };

      const mockUsers = [{ email: 'user1@example.com' }];

      db.user.find.mockResolvedValue(mockUsers);
      db.attendance.find.mockResolvedValue([]);

      await attendanceController.listAttendancesByDate(req, res);

      expect(db.user.find).toHaveBeenCalledWith({ batch: 'Batch 1' }, { email: 1 });
    });
  });

  describe('getLatestAttendanceStatus', () => {
    it('should return attendance status when entry exists', async () => {
      req.params.email = 'user@example.com';

      const mockAttendance = {
        email: 'user@example.com',
        in: { date: new Date(), time: '09:00' },
        lastScan: 'in',
      };

      db.attendance.findOne.mockResolvedValue(mockAttendance);

      // Mock current date
      jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('1/15/2024');

      await attendanceController.getLatestAttendanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in',
        })
      );
    });

    it('should return "not scanned" when no entry exists', async () => {
      req.params.email = 'user@example.com';

      db.attendance.findOne.mockResolvedValue(null);

      jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('1/15/2024');

      await attendanceController.getLatestAttendanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not scanned',
        })
      );
    });
  });

  describe('listAttendancesByMonthAndBatch', () => {
    it('should list all attendances when no filters provided', async () => {
      req.body = {};

      const mockAttendances = [
        {
          email: 'user@example.com',
          in: { date: new Date('2024-01-15'), time: '09:00' },
          out: { date: new Date('2024-01-15'), time: '18:00' },
          toObject: function() {
            return {
              email: this.email,
              in: this.in,
              out: this.out,
            };
          },
        },
      ];

      db.attendance.find.mockResolvedValue(mockAttendances);
      db.user.findOne.mockResolvedValue({ name: 'User 1' });
      db.image.findOne.mockResolvedValue({ data: 'image-data' });

      await attendanceController.listAttendancesByMonthAndBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          attendances: expect.any(Array),
        })
      );
    });

    it('should filter by month and year', async () => {
      req.body = {
        month: 1,
        year: 2024,
      };

      db.attendance.find.mockResolvedValue([]);

      await attendanceController.listAttendancesByMonthAndBatch(req, res);

      expect(db.attendance.find).toHaveBeenCalled();
    });

    it('should filter by batch only', async () => {
      req.body = {
        batch: 'Batch 1',
      };

      const mockUsers = [{ email: 'user1@example.com' }];
      const mockAttendances = [
        {
          email: 'user1@example.com',
          in: { date: new Date('2024-01-15'), time: '09:00' },
          toObject: function() {
            return {
              email: this.email,
              in: this.in,
              out: this.out,
            };
          },
        },
      ];

      db.user.find.mockResolvedValue(mockUsers);
      db.attendance.find.mockResolvedValue(mockAttendances);
      db.user.findOne.mockResolvedValue({ name: 'User 1' });
      db.image.findOne.mockResolvedValue({ data: 'image-data' });

      await attendanceController.listAttendancesByMonthAndBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

