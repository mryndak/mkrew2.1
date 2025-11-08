# User Registration API - Implementation Guide

## Implemented: US-001 - User Registration

### Endpoint
```
POST /api/v1/auth/register
```

### Description
Creates a new user account with email verification flow. This implements US-001 from the PRD.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "favoriteRckikIds": [1, 3],
  "consentVersion": "1.0",
  "consentAccepted": true
}
```

**Field Validation:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email format, max 255 chars, unique |
| `password` | string | ✅ | Min 8 chars, must contain uppercase, lowercase, digit, special char |
| `firstName` | string | ✅ | Max 100 chars |
| `lastName` | string | ✅ | Max 100 chars |
| `bloodGroup` | string | ❌ | Must be one of: 0+, 0-, A+, A-, B+, B-, AB+, AB- |
| `favoriteRckikIds` | array[long] | ❌ | Array of valid RCKiK IDs |
| `consentVersion` | string | ✅ | Max 20 chars, current policy version |
| `consentAccepted` | boolean | ✅ | Must be true |

### Success Response

**Status Code:** `201 Created`

**Body:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "emailVerified": false,
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Error Responses

#### Validation Error (400 Bad Request)
```json
{
  "timestamp": "2025-01-08T17:30:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/auth/register",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid",
      "rejectedValue": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      "rejectedValue": null
    }
  ]
}
```

#### Email Already Exists (400 Bad Request)
```json
{
  "timestamp": "2025-01-08T17:30:00",
  "status": 400,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Email is already registered",
  "path": "/api/v1/auth/register"
}
```

#### RCKiK Not Found (404 Not Found)
```json
{
  "timestamp": "2025-01-08T17:30:00",
  "status": 404,
  "error": "RESOURCE_NOT_FOUND",
  "message": "One or more RCKiK centers not found",
  "path": "/api/v1/auth/register"
}
```

## Business Logic Implementation

### 1. Email Uniqueness Check
- Checks if email already exists in database
- Throws `EmailAlreadyExistsException` if duplicate

### 2. Password Hashing
- Uses BCrypt with cost factor 12
- Password stored as hash in `users.password_hash`

### 3. User Creation
- Creates user with `email_verified=false`
- Stores consent timestamp and version
- Email converted to lowercase for consistency

### 4. Favorite RCKiK Centers
- Validates all provided RCKiK IDs exist
- Creates `user_favorite_rckik` entries with priority
- Throws `ResourceNotFoundException` if any ID invalid

### 5. Verification Token Generation
- Generates UUID token
- Token type: `EMAIL_VERIFICATION`
- Expires in 24 hours
- Stored in `user_tokens` table

### 6. Email Sending
- **TODO:** Currently mocked
- Should send verification email with token
- Email will contain link: `/api/v1/auth/verify-email?token={token}`

## Testing with cURL

### Basic Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "bloodGroup": "A+",
    "consentVersion": "1.0",
    "consentAccepted": true
  }'
```

### Registration with Favorite RCKiK
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "SecurePass123!",
    "firstName": "Anna",
    "lastName": "Nowak",
    "bloodGroup": "B+",
    "favoriteRckikIds": [1, 2],
    "consentVersion": "1.0",
    "consentAccepted": true
  }'
```

### Test Validation Errors
```bash
# Invalid email
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "consentVersion": "1.0",
    "consentAccepted": true
  }'

# Weak password
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User",
    "consentVersion": "1.0",
    "consentAccepted": true
  }'

# Invalid blood group
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "bloodGroup": "XYZ",
    "consentVersion": "1.0",
    "consentAccepted": true
  }'
```

## Database Changes

After successful registration, the following tables are affected:

### `users` table
```sql
INSERT INTO users (
  email, password_hash, first_name, last_name, blood_group,
  email_verified, consent_timestamp, consent_version, created_at, updated_at
) VALUES (
  'user@example.com', '$2a$12$...', 'Jan', 'Kowalski', 'A+',
  false, NOW(), '1.0', NOW(), NOW()
);
```

### `user_tokens` table
```sql
INSERT INTO user_tokens (
  user_id, token, token_type, expires_at, created_at
) VALUES (
  123, 'uuid-token-here', 'EMAIL_VERIFICATION', NOW() + INTERVAL '24 hours', NOW()
);
```

### `user_favorite_rckik` table (if favoriteRckikIds provided)
```sql
INSERT INTO user_favorite_rckik (user_id, rckik_id, priority, created_at)
VALUES (123, 1, 1, NOW()), (123, 3, 2, NOW());
```

## Implementation Details

### Files Created

**Repositories:**
- `UserRepository.java` - User data access
- `UserTokenRepository.java` - Token management
- `RckikRepository.java` - RCKiK data access
- `UserFavoriteRckikRepository.java` - Favorite centers

**DTOs:**
- `RegisterRequest.java` - Request payload with validation
- `RegisterResponse.java` - Success response
- `ErrorResponse.java` - Error response structure

**Service:**
- `AuthService.java` - Registration business logic

**Controller:**
- `AuthController.java` - REST endpoint

**Config:**
- `SecurityConfig.java` - Spring Security configuration

**Exception Handling:**
- `GlobalExceptionHandler.java` - Centralized error handling
- `EmailAlreadyExistsException.java` - Duplicate email error
- `ResourceNotFoundException.java` - Resource not found error

### Security Configuration

Spring Security configured with:
- CSRF disabled (stateless API)
- Session management: STATELESS
- Public endpoints: `/api/v1/auth/**`, `/actuator/health`, `/actuator/info`
- All other endpoints require authentication

### Password Encoding

BCrypt with cost factor 12:
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

## Next Steps

1. ✅ User Registration (US-001) - **IMPLEMENTED**
2. ⏳ Email Verification (US-002) - Implement verification endpoint
3. ⏳ Email Service - Integrate with SendGrid/Mailgun
4. ⏳ Login Endpoint (US-003) - Implement JWT authentication
5. ⏳ Password Reset (US-004) - Implement reset flow

## Testing Checklist

- [ ] Register with valid data succeeds
- [ ] Register with duplicate email fails
- [ ] Register with invalid email fails
- [ ] Register with weak password fails
- [ ] Register with invalid blood group fails
- [ ] Register with valid favorite RCKiK IDs succeeds
- [ ] Register with invalid RCKiK IDs fails
- [ ] Consent not accepted fails
- [ ] Verification token generated correctly
- [ ] User created with email_verified=false
- [ ] Password hashed correctly (BCrypt)
- [ ] Favorite RCKiK associations created

## Verification

Check if user was created:
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, email, first_name, last_name, blood_group, email_verified FROM users ORDER BY created_at DESC LIMIT 5;"
```

Check verification token:
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, user_id, token_type, expires_at, used_at FROM user_tokens ORDER BY created_at DESC LIMIT 5;"
```

Check favorite RCKiK:
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT ufr.id, ufr.user_id, r.name, ufr.priority FROM user_favorite_rckik ufr JOIN rckik r ON ufr.rckik_id = r.id ORDER BY ufr.created_at DESC LIMIT 5;"
```
