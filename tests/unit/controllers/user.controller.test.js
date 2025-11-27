const userController = require('../../../app/Attendance/controllers/user.controller');
const db = require('../../../app/Attendance/models');
const bcrypt = require('bcrypt');
const { sendPasswordResetOTP } = require('../../../app/Attendance/utils/emailService');

// Mock dependencies
jest.mock('../../../app/Attendance/models');
jest.mock('bcrypt');
jest.mock('../../../app/Attendance/utils/emailService');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      file: {
        buffer: Buffer.from('test-image'),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      req.params.email = 'user@example.com';

      const mockUser = {
        email: 'user@example.com',
        name: 'John Doe',
        userId: '0001',
      };

      db.user.findOne.mockResolvedValue(mockUser);

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        })
      );
    });

    it('should return 404 when user not found', async () => {
      req.params.email = 'nonexistent@example.com';

      db.user.findOne.mockResolvedValue(null);

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      req.body.email = 'user@example.com';
      req.file = {
        buffer: Buffer.from('test-image-data'),
      };

      db.image.findOne.mockResolvedValue(null);
      db.image.prototype.save = jest.fn().mockResolvedValue(true);
      db.image.mockImplementation(() => ({
        email: 'user@example.com',
        data: 'base64-encoded',
        save: jest.fn().mockResolvedValue(true),
      }));

      await userController.uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Image uploaded successfully',
        })
      );
    });

    it('should update existing image', async () => {
      req.body.email = 'user@example.com';
      req.file = {
        buffer: Buffer.from('new-image-data'),
      };

      const mockImage = {
        email: 'user@example.com',
        data: 'old-base64',
        save: jest.fn().mockResolvedValue(true),
      };

      db.image.findOne.mockResolvedValue(mockImage);

      await userController.uploadImage(req, res);

      expect(mockImage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getImageByEmail', () => {
    it('should get image successfully', async () => {
      req.body.email = 'user@example.com';

      const mockImage = {
        email: 'user@example.com',
        data: 'base64-image-data',
      };

      db.image.findOne.mockResolvedValue(mockImage);

      await userController.getImageByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          image: mockImage,
        })
      );
    });

    it('should return 404 when image not found', async () => {
      req.body.email = 'user@example.com';

      db.image.findOne.mockResolvedValue(null);

      await userController.getImageByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Image not found',
        })
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      req.params.email = 'user@example.com';

      const mockImage = {
        email: 'user@example.com',
      };

      db.image.findOne.mockResolvedValue(mockImage);
      db.image.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await userController.deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Image deleted successfully',
        })
      );
    });

    it('should return 404 when image not found', async () => {
      req.params.email = 'user@example.com';

      db.image.findOne.mockResolvedValue(null);

      await userController.deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      req.body = {
        email: 'user@example.com',
        name: 'Updated Name',
        address: 'New Address',
        phoneNumber: '9876543210',
        batch: 'Batch 2',
        designation: 'Senior Developer',
      };

      const mockUser = {
        email: 'user@example.com',
        name: 'Updated Name',
      };

      db.user.findOneAndUpdate.mockResolvedValue(mockUser);

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User details updated successfully',
        })
      );
    });

    it('should return 404 when user not found', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        name: 'Test',
      };

      db.user.findOneAndUpdate.mockResolvedValue(null);

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getOtp', () => {
    it('should generate and send OTP successfully', async () => {
      req.body.email = 'user@example.com';

      const mockUser = {
        email: 'user@example.com',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.otp.deleteOne.mockResolvedValue(true);
      db.otp.create.mockResolvedValue({ email: 'user@example.com', otp: '1234' });
      sendPasswordResetOTP.mockResolvedValue({ success: true });

      await userController.getOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email sent successfully',
        })
      );
      expect(sendPasswordResetOTP).toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      req.body.email = 'invalid-email';

      await userController.getOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid email format',
        })
      );
    });

    it('should return 404 when user not found', async () => {
      req.body.email = 'nonexistent@example.com';

      db.user.findOne.mockResolvedValue(null);

      await userController.getOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      req.body = {
        email: 'user@example.com',
        otp: '1234',
      };

      const mockUser = {
        email: 'user@example.com',
      };
      const mockOtp = {
        email: 'user@example.com',
        otp: '1234',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.otp.findOne.mockResolvedValue(mockOtp);
      db.otp.deleteOne.mockResolvedValue(true);

      await userController.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'otp verified',
        })
      );
    });

    it('should reject invalid OTP', async () => {
      req.body = {
        email: 'user@example.com',
        otp: '9999',
      };

      const mockUser = {
        email: 'user@example.com',
      };

      db.user.findOne.mockResolvedValue(mockUser);
      db.otp.findOne.mockResolvedValue(null);

      await userController.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'invalid otp',
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'newpassword123',
      };

      const mockUser = {
        email: 'user@example.com',
        password: 'old-hashed',
        save: jest.fn().mockResolvedValue(true),
      };

      db.user.findOne.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('new-hashed-password');

      await userController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password resetted successfully',
        })
      );
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject short password', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'short',
      };

      const mockUser = {
        email: 'user@example.com',
      };

      db.user.findOne.mockResolvedValue(mockUser);

      await userController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password should be at least 8 characters long',
        })
      );
    });

    it('should return 404 when user not found', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'newpassword123',
      };

      db.user.findOne.mockResolvedValue(null);

      await userController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

