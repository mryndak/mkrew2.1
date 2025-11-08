# Login API - Implementation Guide

## Implemented: US-003 - User Login

### Endpoint
```
POST /api/v1/auth/login
```

### Description
Authenticates user with email and password, returns JWT access and refresh tokens. This implements US-003 from the PRD with full rate limiting and security features.

### Request

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Validation:**
- `email`: Required, valid email format
- `password`: Required, non-blank

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNDcxNTIwMCwiZXhwIjoxNzA0NzE4ODAwfQ.signature",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNDcxNTIwMCwiZXhwIjoxNzA1MzIwMDAwfQ.signature",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "bloodGroup": "A+",
    "emailVerified": true,
    "role": "USER"
  }
}
```

**Field Descriptions:**
- `accessToken`: JWT token for API authentication (1 hour TTL)
- `tokenType`: Always "Bearer"
- `expiresIn`: Token expiration time in seconds (3600 = 1 hour)
- `refreshToken`: JWT refresh token for obtaining new access tokens (7 days TTL)
- `user`: User profile information

### Error Responses

#### Invalid Credentials (401 Unauthorized)
Wrong email or password:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "path": "/api/v1/auth/login"
}
```

#### Email Not Verified (403 Forbidden)
User hasn't verified email yet:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 403,
  "error": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email before logging in",
  "path": "/api/v1/auth/login"
}
```

#### Too Many Failed Attempts (429 Too Many Requests)
Account temporarily locked after 5 failed attempts:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 429,
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Account temporarily locked. Please try again in 5 minutes.",
  "path": "/api/v1/auth/login"
}
```

**Response Headers:**
```
Retry-After: 300
```
(300 seconds = 5 minutes)

#### Validation Error (400 Bad Request)
Missing or invalid fields:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/auth/login",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid",
      "rejectedValue": "invalid-email"
    }
  ]
}
```

## Business Logic Implementation

### 1. Rate Limiting Check
- Checks if account is locked due to failed attempts
- Maximum 5 failed attempts allowed
- Lockout duration: 5 minutes
- Throws `AccountLockedException` if locked

### 2. User Lookup
- Searches `users` table for email (case-insensitive)
- Filters active users only (`deleted_at IS NULL`)
- Throws `InvalidCredentialsException` if not found
- Records failed attempt on exception

### 3. Password Verification
- Uses BCrypt password encoder to verify hash
- Throws `InvalidCredentialsException` if mismatch
- Records failed attempt on exception
- **Security**: Generic error message prevents user enumeration

### 4. Email Verification Check
- Validates `email_verified = true`
- Throws `EmailNotVerifiedException` if not verified
- User must complete US-002 before logging in

### 5. Reset Failed Attempts
- Clears lockout counter on successful authentication
- Resets lockout expiration time

### 6. JWT Token Generation
- **Access Token**: 1 hour TTL (3600 seconds)
  - Claims: `sub` (user ID), `email`, `role`, `iat`, `exp`
  - Algorithm: HS256 (HMAC with SHA-256)
- **Refresh Token**: 7 days TTL (604800 seconds)
  - Claims: `sub` (user ID), `type` = "refresh", `iat`, `exp`
- Secret key from `application.yml` (env variable: `JWT_SECRET`)

### 7. Response Building
- Constructs `UserDto` with user profile data
- Assembles `LoginResponse` with tokens and user info
- Returns HTTP 200 OK

## Flow Diagram

```
POST /api/v1/auth/login
    ↓
┌─────────────────────┐
│ Account locked?     │ YES → 429 TOO_MANY_ATTEMPTS (with Retry-After header)
└─────────────────────┘
    ↓ NO
┌─────────────────────┐
│ User exists?        │ NO → 401 INVALID_CREDENTIALS + Record failed attempt
└─────────────────────┘
    ↓ YES
┌─────────────────────┐
│ Password matches?   │ NO → 401 INVALID_CREDENTIALS + Record failed attempt
└─────────────────────┘
    ↓ YES
┌─────────────────────┐
│ Email verified?     │ NO → 403 EMAIL_NOT_VERIFIED
└─────────────────────┘
    ↓ YES
Reset failed attempts
Generate JWT tokens
Build user DTO
    ↓
200 OK with tokens and user data
```

## JWT Token Details

### Access Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "123",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1704715200,
  "exp": 1704718800
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Refresh Token Structure

**Payload:**
```json
{
  "sub": "123",
  "type": "refresh",
  "iat": 1704715200,
  "exp": 1705320000
}
```

### Token Usage

**Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Protected Endpoint Example:**
```bash
curl -X GET "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Testing with cURL

### Successful Login
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "bloodGroup": "A+",
    "emailVerified": true,
    "role": "USER"
  }
}
```

### Test Invalid Credentials
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response:**
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

### Test Email Not Verified
```bash
# Register new user (email_verified=false)
curl -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "New",
    "lastName": "User",
    "bloodGroup": "B+",
    "consentVersion": "1.0",
    "consentAccepted": true
  }'

# Try to login before verification
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 403,
  "error": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email before logging in"
}
```

### Test Rate Limiting
```bash
# Make 5 failed login attempts
for i in {1..5}; do
  curl -X POST "http://localhost:8080/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "WrongPassword"
    }'
  echo "\nAttempt $i completed\n"
done

# 6th attempt should be blocked
curl -v -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "CorrectPassword"
  }'
```

**Expected Response (6th attempt):**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 300

{
  "timestamp": "2025-01-08T18:00:00",
  "status": 429,
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Account temporarily locked. Please try again in 5 minutes.",
  "path": "/api/v1/auth/login"
}
```

## Database Impact

### No Database Changes
Login operation is read-only and does not modify database state.

**Tables Queried:**
- `users`: Lookup by email, check email_verified

**In-Memory State (LoginAttemptService):**
- Tracks failed attempts per email
- Stores lockout expiration time
- Automatically clears after lockout expires

## Implementation Details

### Files Created/Modified

**DTOs:**
- `LoginRequest.java` - Request payload
- `LoginResponse.java` - Success response with tokens
- `UserDto.java` - User profile data

**Security:**
- `JwtTokenProvider.java` - JWT generation and validation
- `LoginAttemptService.java` - Rate limiting service

**Exceptions:**
- `InvalidCredentialsException.java` - Invalid email/password
- `EmailNotVerifiedException.java` - Email not verified
- `AccountLockedException.java` - Too many failed attempts
- `GlobalExceptionHandler.java` - Updated with new handlers

**Service:**
- `AuthService.login()` - Login business logic

**Controller:**
- `AuthController.login()` - POST endpoint

**Configuration:**
- `build.gradle` - Added JWT dependencies (jjwt-api, jjwt-impl, jjwt-jackson)
- `application.yml` - JWT secret and expiration configuration

### Service Method

```java
@Transactional
public LoginResponse login(LoginRequest request) {
    String email = request.getEmail().toLowerCase();

    // 1. Check rate limiting
    if (loginAttemptService.isLocked(email)) {
        int retryAfter = loginAttemptService.getLockoutTimeRemaining(email);
        throw new AccountLockedException(
            "Account temporarily locked. Please try again in " + retryAfter / 60 + " minutes.",
            retryAfter
        );
    }

    // 2. Find user
    User user = userRepository.findByEmailAndDeletedAtIsNull(email)
        .orElseThrow(() -> {
            loginAttemptService.recordFailedAttempt(email);
            return new InvalidCredentialsException("Invalid email or password");
        });

    // 3. Verify password
    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
        loginAttemptService.recordFailedAttempt(email);
        throw new InvalidCredentialsException("Invalid email or password");
    }

    // 4. Check email verification
    if (!user.getEmailVerified()) {
        throw new EmailNotVerifiedException("Please verify your email before logging in");
    }

    // 5. Reset attempts
    loginAttemptService.resetAttempts(email);

    // 6. Generate tokens
    String accessToken = jwtTokenProvider.generateAccessToken(user);
    String refreshToken = jwtTokenProvider.generateRefreshToken(user);

    // 7. Build response
    return LoginResponse.builder()
        .accessToken(accessToken)
        .tokenType("Bearer")
        .expiresIn(jwtTokenProvider.getAccessTokenExpirationInSeconds())
        .refreshToken(refreshToken)
        .user(buildUserDto(user))
        .build();
}
```

### Controller Endpoint

```java
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    log.info("POST /api/v1/auth/login - Login request for email: {}", request.getEmail());

    LoginResponse response = authService.login(request);

    log.info("Login successful for user ID: {}", response.getUser().getId());

    return ResponseEntity.ok(response);
}
```

## Security Considerations

### Password Security
- ✅ BCrypt hashing with cost factor 12
- ✅ Passwords never logged or exposed
- ✅ Generic error messages (no user enumeration)

### Token Security
- ✅ HS256 algorithm (HMAC-SHA256)
- ✅ Secret key stored in environment variables
- ✅ Short TTL for access tokens (1 hour)
- ✅ Refresh tokens for extended sessions (7 days)
- ✅ Stateless JWT (no server-side session storage)

### Rate Limiting
- ✅ Maximum 5 failed attempts
- ✅ 5-minute lockout period
- ✅ Lockout tracked per email (case-insensitive)
- ✅ Automatic lockout expiration
- ✅ In-memory storage (MVP) - can be upgraded to Redis/DB

### Attack Vectors Prevented
1. **Brute Force**: Rate limiting prevents password guessing
2. **User Enumeration**: Generic error messages for invalid credentials
3. **Timing Attacks**: BCrypt has constant-time comparison
4. **Session Hijacking**: Stateless JWT, short expiration
5. **Credential Stuffing**: Rate limiting per email

### Future Enhancements
- CAPTCHA after 3 failed attempts
- IP-based rate limiting (in addition to email)
- Device fingerprinting
- Session revocation (blacklist tokens)
- Two-factor authentication (2FA)
- Login history tracking in database
- Suspicious login detection (new location/device)

## Integration with Other User Stories

### Prerequisites
1. **US-001 (Registration)**: User must be registered
2. **US-002 (Email Verification)**: User must verify email before login

### Enables
3. **US-005 (Profile Management)**: Access token needed for authenticated endpoints
4. **US-006 (Notification Preferences)**: Requires authentication
5. **US-009 (Favorite RCKiK)**: Requires authentication
6. **US-012 (Donation Diary)**: Requires authentication

### Complete Authentication Flow

```
1. User Registration (US-001)
   POST /api/v1/auth/register
   → email_verified=false, verification token generated

2. Email Verification (US-002)
   GET /api/v1/auth/verify-email?token={token}
   → email_verified=true

3. User Login (US-003)
   POST /api/v1/auth/login
   → Returns JWT access token

4. Access Protected Resources
   GET /api/v1/users/me
   Header: Authorization: Bearer {accessToken}
   → Returns user profile
```

## Configuration

### Application Configuration (application.yml)

```yaml
jwt:
  secret: ${JWT_SECRET:VerySecureSecretKeyForJWTTokenSigningThatIsAtLeast256BitsLongForHS256Algorithm}
  expiration: 3600000  # 1 hour in milliseconds
  refresh:
    expiration: 604800000  # 7 days in milliseconds
```

### Environment Variables

**Development:**
```bash
# .env file or IDE configuration
JWT_SECRET=YourSecretKeyHereMustBeAtLeast256BitsForHS256
```

**Production (GCP Secret Manager):**
```bash
# Store in GCP Secret Manager
gcloud secrets create jwt-secret --data-file=-
# Inject into Cloud Run/GKE as env variable
```

**Security Requirements:**
- JWT secret must be at least 256 bits (32 characters) for HS256
- Use cryptographically secure random string
- Never commit secrets to version control
- Rotate secrets periodically (e.g., every 90 days)

### Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
```

## Verification Queries

### Check Login Attempts (In-Memory)
Login attempts are stored in-memory and automatically expire. No database queries needed.

To debug lockouts, check application logs:
```
2025-01-08 18:00:00 WARN  LoginAttemptService : Account locked for email: user@example.com due to 5 failed attempts
```

### Verify User Can Login
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, email, email_verified, deleted_at
      FROM users
      WHERE email = 'user@example.com';"
```

**Expected Result:**
```
 id |       email        | email_verified | deleted_at
----+--------------------+----------------+------------
 123 | user@example.com  |       t        |
```

Requirements for successful login:
- `email_verified = true`
- `deleted_at IS NULL` (or NULL)

## Testing Checklist

- [ ] Login with valid credentials succeeds
- [ ] Returns valid JWT access token
- [ ] Returns valid JWT refresh token
- [ ] User object in response matches database
- [ ] Token expires in 3600 seconds (1 hour)
- [ ] Login with invalid email returns 401 INVALID_CREDENTIALS
- [ ] Login with invalid password returns 401 INVALID_CREDENTIALS
- [ ] Login with unverified email returns 403 EMAIL_NOT_VERIFIED
- [ ] 5 failed attempts locks account
- [ ] 6th attempt returns 429 TOO_MANY_ATTEMPTS
- [ ] Retry-After header present in 429 response
- [ ] Lockout expires after 5 minutes
- [ ] Successful login resets failed attempt counter
- [ ] Failed attempts are case-insensitive (Email@Example.com = email@example.com)
- [ ] JWT token can be used to access protected endpoints
- [ ] JWT token validation works correctly
- [ ] Token expiration is enforced

## Error Scenarios

### Scenario 1: User Forgot Password
**Problem:** User cannot remember password.

**Solution (Future - US-004):**
- Implement "Forgot Password" endpoint
- Send password reset email with token
- Allow password reset without login

### Scenario 2: Account Locked
**Problem:** User locked out after failed attempts.

**Solution:**
- Wait 5 minutes for automatic lockout expiration
- Use correct password after lockout expires
- Future: Admin endpoint to manually unlock accounts

### Scenario 3: Token Expired
**Problem:** Access token expired (after 1 hour).

**Solution (Future):**
- Implement token refresh endpoint
- Use refresh token to obtain new access token
- POST /api/v1/auth/refresh with refresh token

### Scenario 4: Device Lost
**Problem:** User's device is lost/stolen with saved tokens.

**Solution (Future):**
- Implement logout/revoke token endpoint
- Maintain token blacklist in Redis
- Allow user to revoke all sessions

## Next Steps

1. ✅ User Registration (US-001) - IMPLEMENTED
2. ✅ Email Verification (US-002) - IMPLEMENTED
3. ✅ User Login (US-003) - IMPLEMENTED
4. ⏳ Password Reset (US-004)
5. ⏳ JWT Authentication Filter (for protected endpoints)
6. ⏳ Token Refresh Endpoint
7. ⏳ Logout Endpoint (token revocation)
8. ⏳ Integration tests for login flow
9. ⏳ Email service integration (SendGrid/Mailgun)

## Related Documentation

- User Registration: `API-REGISTRATION.md`
- Email Verification: `API-EMAIL-VERIFICATION.md`
- API Plan: `.ai/api-plan.md`
- Database Schema: `.ai/plan-db.md`
- PRD: `.ai/prd.md`
- Tech Stack: `.ai/tech-stack.md`
