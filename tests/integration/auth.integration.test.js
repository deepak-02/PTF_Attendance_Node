const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../../app/Attendance/routes/auth.routes');
const db = require('../../app/Attendance/models');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    // Clean up test database
    await db.user.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await db.user.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: '123 Test St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('userId');

      // Verify user was created
      const user = await db.user.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
        address: '123 Test St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Password should be at least 8 characters long');
    });

    it('should reject duplicate email', async () => {
      // Create first user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: '123 Test St',
        phoneNumber: '1234567890',
        batch: 'Batch 1',
        designation: 'Developer',
        role: 'user',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User with the same email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.user.create({
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
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('role', 'user');
      expect(response.body).toHaveProperty('name', 'Test User');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });
  });
});

