# Backend Test Suite

This directory contains comprehensive test cases for the PTF Attendance Node.js backend.

## Test Structure

```
tests/
├── setup.js                    # Test configuration and mocks
├── unit/                       # Unit tests
│   ├── controllers/           # Controller unit tests
│   │   ├── auth.controller.test.js
│   │   ├── qr.controller.test.js
│   │   ├── user.controller.test.js
│   │   ├── attendance.controller.test.js
│   │   ├── leave.controller.test.js
│   │   └── late.controller.test.js
│   └── utils/                 # Utility unit tests
│       ├── emailService.test.js
│       └── pushNotificationService.test.js
└── integration/               # Integration tests
    ├── auth.integration.test.js
    └── qr.integration.test.js
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Coverage

The test suite covers:
- ✅ Authentication (register, login, user management)
- ✅ QR code generation and verification
- ✅ User profile management
- ✅ Attendance tracking
- ✅ Leave request management
- ✅ Late request management
- ✅ Email service
- ✅ Push notification service

## Test Environment

Tests use a separate test database configured in `.env.test`. Make sure MongoDB is running before executing integration tests.

## Mocking

- Firebase Admin is mocked in `setup.js`
- Email service is mocked in unit tests
- Database models are mocked in unit tests
- Real database is used in integration tests

