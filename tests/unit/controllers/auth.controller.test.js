const authController = require('../../../app/Attendance/controllers/auth.controller');
const db = require('../../../app/Attendance/models');
const bcrypt = require('bcrypt');
const { sendWelcomeEmail, sendAccountDeletionEmail } = require('../../../app/Attendance/utils/emailService');

// Mock dependencies
jest.mock('../../../app/Attendance/models');
jest.mock('bcrypt');
jest.mock('../../../app/Attendance/utils/emailService');

describe('Auth Controller', () => {
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

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        address: '123 Main St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
        role: 'user',
      };

      db.user.findOne.mockResolvedValue(null);
      db.user.prototype.save = jest.fn().mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashed-password');
      db.user.findOne.mockImplementationOnce(() => null).mockImplementationOnce(() => ({ userId: '0001' }));
      sendWelcomeEmail.mockResolvedValue({ success: true });

      // Mock generateUserId
      db.user.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: '0001' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
        })
      );
      expect(sendWelcomeEmail).toHaveBeenCalled();
    });

    it('should reject registration with short password', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'short',
        name: 'John Doe',
        address: '123 Main St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password should be at least 8 characters long',
        })
      );
    });

    it('should reject registration with existing email', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'John Doe',
        address: '123 Main St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
      };

      db.user.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User with the same email already exists',
        })
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        email: 'john@example.com',
        password: 'hashed-password',
        role: 'user',
        name: 'John Doe',
        batch: 'Batch 1',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          role: 'user',
        })
      );
    });

    it('should reject login with invalid email format', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'password123',
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email format',
        })
      );
    });

    it('should reject login with invalid password', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        email: 'john@example.com',
        password: 'hashed-password',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
        })
      );
    });

    it('should reject login with non-existent user', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      db.user.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
        })
      );
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      req.params.batchFilter = 'All';

      const mockUsers = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ];

      const mockImages = [
        { email: 'user1@example.com', data: 'base64-image-1' },
        { email: 'user2@example.com', data: 'base64-image-2' },
      ];

      db.user.find.mockResolvedValue(mockUsers);
      db.image.find.mockResolvedValue(mockImages);

      await authController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should filter users by batch', async () => {
      req.params.batchFilter = 'Batch 1';

      const mockUsers = [
        { email: 'user1@example.com', name: 'User 1', batch: 'Batch 1' },
      ];

      db.user.find.mockResolvedValue(mockUsers);
      db.image.find.mockResolvedValue([]);

      await authController.getAllUsers(req, res);

      expect(db.user.find).toHaveBeenCalledWith({ batch: 'Batch 1' }, { password: 0 });
    });

    it('should return 404 when no users found', async () => {
      req.params.batchFilter = 'All';

      db.user.find.mockResolvedValue([]);

      await authController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No users found',
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req.params.email = 'user@example.com';

      const mockUser = {
        _id: 'user-id',
        name: 'John Doe',
        email: 'user@example.com',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.user.findByIdAndDelete.mockResolvedValue(mockUser);
      sendAccountDeletionEmail.mockResolvedValue({ success: true });

      await authController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User deleted successfully',
        })
      );
      expect(sendAccountDeletionEmail).toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      req.params.email = 'nonexistent@example.com';

      db.user.findOne.mockResolvedValue(null);

      await authController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });
  });
});

