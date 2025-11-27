const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const qrRoutes = require('../../app/Attendance/routes/qr.routes');
const db = require('../../app/Attendance/models');
const bcrypt = require('bcrypt');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/qr', qrRoutes);

describe('QR Integration Tests', () => {
  let testUser;
  let testQR;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await db.user.deleteMany({});
    await db.qr.deleteMany({});
    await db.attendance.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await db.user.create({
      userId: '0001',
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      address: '123 Test St',
      phoneNumber: '1234567890',
      batch: 'Batch 1',
      designation: 'Developer',
      role: 'user',
    });

    // Clear QR and attendance
    await db.qr.deleteMany({});
    await db.attendance.deleteMany({});
  });

  describe('GET /api/qr/get', () => {
    it('should generate QR code', async () => {
      const response = await request(app)
        .get('/api/qr/get')
        .expect(200);

      expect(response.body).toHaveProperty('qrString');
      expect(response.body.qrString).toMatch(/^attendance-.*ptf$/);

      // Verify QR was saved
      const qr = await db.qr.findOne();
      expect(qr).toBeTruthy();
      expect(qr.qrString).toBe(response.body.qrString);
    });
  });

  describe('POST /api/qr/verify', () => {
    it('should mark attendance IN successfully', async () => {
      // Generate QR first
      const qrResponse = await request(app)
        .get('/api/qr/get')
        .expect(200);

      const qrCode = qrResponse.body.qrString;

      // Mock current time to be before late window
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('08:00:00');
      jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('1/15/2024');

      const response = await request(app)
        .post('/api/qr/verify')
        .send({
          qrCode: qrCode,
          email: 'test@example.com',
          lastScan: 'in',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'QR verification successful');

      // Verify attendance was created
      const attendance = await db.attendance.findOne({ email: 'test@example.com' });
      expect(attendance).toBeTruthy();
      expect(attendance.lastScan).toBe('in');
      expect(attendance.in.late).toBe(false);

      // Verify QR was deleted
      const qr = await db.qr.findOne({ qrString: qrCode });
      expect(qr).toBeNull();
    });

    it('should mark attendance OUT successfully', async () => {
      // First mark IN
      const qrResponse = await request(app)
        .get('/api/qr/get')
        .expect(200);

      const qrCodeIn = qrResponse.body.qrString;

      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('08:00:00');
      jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('1/15/2024');

      await request(app)
        .post('/api/qr/verify')
        .send({
          qrCode: qrCodeIn,
          email: 'test@example.com',
          lastScan: 'in',
        })
        .expect(200);

      // Now mark OUT
      const qrResponseOut = await request(app)
        .get('/api/qr/get')
        .expect(200);

      const qrCodeOut = qrResponseOut.body.qrString;

      const response = await request(app)
        .post('/api/qr/verify')
        .send({
          qrCode: qrCodeOut,
          email: 'test@example.com',
          lastScan: 'out',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'QR verification successful');

      // Verify attendance was updated
      const attendance = await db.attendance.findOne({ email: 'test@example.com' });
      expect(attendance.lastScan).toBe('out');
      expect(attendance.out.time).toBeTruthy();
    });

    it('should reject invalid QR code', async () => {
      const response = await request(app)
        .post('/api/qr/verify')
        .send({
          qrCode: 'invalid-qr-code',
          email: 'test@example.com',
          lastScan: 'in',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'QR verification failed');
    });

    it('should reject OUT scan when no IN scan exists', async () => {
      const qrResponse = await request(app)
        .get('/api/qr/get')
        .expect(200);

      const qrCode = qrResponse.body.qrString;

      const response = await request(app)
        .post('/api/qr/verify')
        .send({
          qrCode: qrCode,
          email: 'test@example.com',
          lastScan: 'out',
        })
        .expect(202);

      expect(response.body).toHaveProperty('message', 'Invalid operation. First entry must be IN.');
    });
  });

  describe('GET /api/qr/response', () => {
    it('should return response status', async () => {
      const response = await request(app)
        .get('/api/qr/response')
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('number');
    });
  });
});

