const { 
  sendEmail, 
  sendWelcomeEmail, 
  sendAccountDeletionEmail, 
  sendPasswordResetOTP,
  sendLeaveRequestToAdmin,
  sendLeaveStatusEmail,
  sendLateRequestToAdmin,
  sendLateStatusEmail,
  sendLateAutoApprovalEmail
} = require('../../../app/Attendance/utils/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(mailOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('PTF Attendance'),
          ...mailOptions,
        })
      );
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Email error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const result = await sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Welcome to PTF Attendance',
        })
      );
    });
  });

  describe('sendAccountDeletionEmail', () => {
    it('should send account deletion email', async () => {
      const result = await sendAccountDeletionEmail('user@example.com', 'John Doe');

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Account Deleted',
        })
      );
    });
  });

  describe('sendPasswordResetOTP', () => {
    it('should send password reset OTP email', async () => {
      const result = await sendPasswordResetOTP('user@example.com', '1234');

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Password Reset',
        })
      );
    });
  });

  describe('sendLeaveRequestToAdmin', () => {
    it('should send leave request email to admin', async () => {
      const result = await sendLeaveRequestToAdmin(
        'admin@example.com',
        'John Doe',
        'Family emergency',
        'casual',
        '2024-01-15',
        '2024-01-17'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'Leave Request',
        })
      );
    });
  });

  describe('sendLeaveStatusEmail', () => {
    it('should send leave approval email', async () => {
      const leaveRequest = {
        reason: 'Family emergency',
        type: 'casual',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        requestedOn: '2024-01-10',
        approvedOrRejectedOn: '2024-01-11',
      };

      const result = await sendLeaveStatusEmail(
        'user@example.com',
        'John Doe',
        'approved',
        leaveRequest
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Leave Request Status',
        })
      );
    });

    it('should send leave rejection email', async () => {
      const leaveRequest = {
        reason: 'Family emergency',
        type: 'casual',
        requestDate: '2024-01-15',
        toDate: '2024-01-17',
        requestedOn: '2024-01-10',
        approvedOrRejectedOn: '2024-01-11',
      };

      const result = await sendLeaveStatusEmail(
        'user@example.com',
        'John Doe',
        'rejected',
        leaveRequest
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendLateRequestToAdmin', () => {
    it('should send late request email to admin', async () => {
      const result = await sendLateRequestToAdmin(
        'admin@example.com',
        'John Doe',
        'Traffic jam',
        '2024-01-15'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'Late Request',
        })
      );
    });
  });

  describe('sendLateStatusEmail', () => {
    it('should send late approval email', async () => {
      const lateRequest = {
        reason: 'Traffic jam',
        on: '2024-01-15',
        status: 'approved',
        requestedOn: '2024-01-15 08:00 AM',
      };

      const result = await sendLateStatusEmail(
        'user@example.com',
        'John Doe',
        'approved',
        lateRequest
      );

      expect(result.success).toBe(true);
    });

    it('should send late rejection email', async () => {
      const lateRequest = {
        reason: 'Traffic jam',
        on: '2024-01-15',
        status: 'rejected',
        requestedOn: '2024-01-15 08:00 AM',
      };

      const result = await sendLateStatusEmail(
        'user@example.com',
        'John Doe',
        'rejected',
        lateRequest
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendLateAutoApprovalEmail', () => {
    it('should send late auto-approval email', async () => {
      const result = await sendLateAutoApprovalEmail(
        'user@example.com',
        'John Doe',
        'Traffic jam',
        '2024-01-15'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Late Request Status',
        })
      );
    });
  });
});

