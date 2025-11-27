const { sendPushNotification } = require('../../../app/Attendance/utils/pushNotificationService');
const admin = require('firebase-admin');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  messaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

describe('Push Notification Service', () => {
  let mockMessaging;

  beforeEach(() => {
    mockMessaging = {
      send: jest.fn().mockResolvedValue('test-message-id'),
    };
    admin.messaging.mockReturnValue(mockMessaging);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPushNotification', () => {
    it('should send push notification successfully', async () => {
      const result = await sendPushNotification(
        'test-device-token',
        'Test Title',
        'Test Body',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockMessaging.send).toHaveBeenCalledWith({
        data: {
          click: 'user',
        },
        notification: {
          title: 'Test Title',
          body: 'Test Body',
        },
        token: 'test-device-token',
      });
    });

    it('should handle missing device token', async () => {
      const result = await sendPushNotification(
        null,
        'Test Title',
        'Test Body',
        'user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No device token provided');
      expect(mockMessaging.send).not.toHaveBeenCalled();
    });

    it('should handle Firebase errors', async () => {
      mockMessaging.send.mockRejectedValue(new Error('Firebase error'));

      const result = await sendPushNotification(
        'test-device-token',
        'Test Title',
        'Test Body',
        'user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase error');
    });

    it('should send notification with different click actions', async () => {
      const actions = ['user', 'admin', 'lateUser', 'lateAdmin'];

      for (const action of actions) {
        await sendPushNotification(
          'test-token',
          'Title',
          'Body',
          action
        );

        expect(mockMessaging.send).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { click: action },
          })
        );
      }
    });
  });
});

