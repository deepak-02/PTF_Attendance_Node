const admin = require('firebase-admin');
const config = require('../config/config');

/**
 * Send push notification to a device
 * @param {String} deviceToken - FCM device token
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {String} clickAction - Action to perform on click (user, admin, lateUser, lateAdmin)
 * @returns {Promise} - Promise that resolves when notification is sent
 */
async function sendPushNotification(deviceToken, title, body, clickAction) {
    if (!deviceToken) {
        console.log("No token available");
        return { success: false, error: 'No device token provided' };
    }

    const message = {
        data: {
            "click": clickAction,
        },
        notification: {
            title: title,
            body: body,
        },
        token: deviceToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent push notification:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendPushNotification
};

