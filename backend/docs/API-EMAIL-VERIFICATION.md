# Email Verification API - Implementation Guide

## Implemented: US-002 - Email Verification

### Endpoint
```
GET /api/v1/auth/verify-email
```

### Description
Verifies user email address using token from registration email. This implements US-002 from the PRD.

### Request

**Method:** GET

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | ✅ | Verification token from registration email (UUID format) |

**Example:**
```
GET /api/v1/auth/verify-email?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "user@example.com"
}
```

### Error Responses

#### Invalid Token (400 Bad Request)
Token not found or already used:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Verification token is invalid or has expired",
  "path": "/api/v1/auth/verify-email"
}
```

#### Expired Token (400 Bad Request)
Token has passed 24-hour expiration:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "TOKEN_EXPIRED",
  "message": "Verification token has expired",
  "path": "/api/v1/auth/verify-email"
}
```

#### Token Already Used (400 Bad Request)
Token has already been consumed:
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Verification token has already been used",
  "path": "/api/v1/auth/verify-email"
}
```

## Business Logic Implementation

### 1. Token Lookup
- Searches `user_tokens` table for token with type `EMAIL_VERIFICATION`
- Throws `InvalidTokenException` if not found

### 2. Expiration Check
- Validates `expires_at > NOW()`
- Tokens valid for 24 hours from creation
- Throws `TokenExpiredException` if expired

### 3. Usage Check
- Validates `used_at IS NULL`
- Prevents token reuse
- Throws `InvalidTokenException` if already used

### 4. Idempotency
- If user already has `email_verified=true`, returns success immediately
- Prevents errors on duplicate verification attempts

### 5. User Verification
- Sets `users.email_verified = true`
- Enables user to log in

### 6. Token Marking
- Sets `user_tokens.used_at = NOW()`
- Prevents future reuse

## Flow Diagram

```
Registration (US-001)
    ↓
User receives email with token
    ↓
User clicks verification link
    ↓
GET /api/v1/auth/verify-email?token={token}
    ↓
┌─────────────────────┐
│ Token exists?       │ NO → 400 INVALID_TOKEN
└─────────────────────┘
    ↓ YES
┌─────────────────────┐
│ Token expired?      │ YES → 400 TOKEN_EXPIRED
└─────────────────────┘
    ↓ NO
┌─────────────────────┐
│ Token already used? │ YES → 400 INVALID_TOKEN
└─────────────────────┘
    ↓ NO
┌─────────────────────┐
│ Email verified?     │ YES → 200 OK (idempotent)
└─────────────────────┘
    ↓ NO
Set email_verified=true
Set used_at=NOW()
    ↓
200 OK
```

## Testing with cURL

### Successful Verification
```bash
# Get token from registration response or database
TOKEN="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

curl -X GET "http://localhost:8080/api/v1/auth/verify-email?token=${TOKEN}"
```

**Expected Response:**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "user@example.com"
}
```

### Test Invalid Token
```bash
curl -X GET "http://localhost:8080/api/v1/auth/verify-email?token=invalid-token-123"
```

**Expected Response:**
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Verification token is invalid or has expired"
}
```

### Test Already Used Token
```bash
# Use same token twice
curl -X GET "http://localhost:8080/api/v1/auth/verify-email?token=${TOKEN}"
# Second call should fail
curl -X GET "http://localhost:8080/api/v1/auth/verify-email?token=${TOKEN}"
```

**Second call response:**
```json
{
  "timestamp": "2025-01-08T18:00:00",
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Verification token has already been used"
}
```

### Test Idempotency
```bash
# Manually set email_verified=true in database
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "UPDATE users SET email_verified = true WHERE email = 'test@example.com';"

# Verification should still succeed
curl -X GET "http://localhost:8080/api/v1/auth/verify-email?token=${TOKEN}"
```

## Database Changes

After successful verification:

### `users` table
```sql
UPDATE users
SET email_verified = true,
    updated_at = NOW()
WHERE id = {user_id};
```

**Before:**
| id | email | email_verified | created_at | updated_at |
|----|-------|----------------|------------|------------|
| 123 | user@example.com | false | 2025-01-08 10:00:00 | 2025-01-08 10:00:00 |

**After:**
| id | email | email_verified | created_at | updated_at |
|----|-------|----------------|------------|------------|
| 123 | user@example.com | **true** | 2025-01-08 10:00:00 | **2025-01-08 18:00:00** |

### `user_tokens` table
```sql
UPDATE user_tokens
SET used_at = NOW()
WHERE token = '{token}' AND token_type = 'EMAIL_VERIFICATION';
```

**Before:**
| id | user_id | token | token_type | expires_at | used_at | created_at |
|----|---------|-------|------------|------------|---------|------------|
| 1 | 123 | abc-123 | EMAIL_VERIFICATION | 2025-01-09 10:00:00 | NULL | 2025-01-08 10:00:00 |

**After:**
| id | user_id | token | token_type | expires_at | used_at | created_at |
|----|---------|-------|------------|------------|---------|------------|
| 1 | 123 | abc-123 | EMAIL_VERIFICATION | 2025-01-09 10:00:00 | **2025-01-08 18:00:00** | 2025-01-08 10:00:00 |

## Implementation Details

### Files Created/Modified

**DTOs:**
- `VerifyEmailResponse.java` - Success response

**Exceptions:**
- `InvalidTokenException.java` - Invalid/used token error
- `TokenExpiredException.java` - Expired token error
- `GlobalExceptionHandler.java` - Added handlers for new exceptions

**Service:**
- `AuthService.verifyEmail()` - Verification business logic

**Controller:**
- `AuthController.verifyEmail()` - GET endpoint

### Service Method

```java
@Transactional
public VerifyEmailResponse verifyEmail(String token) {
    // 1. Find token
    UserToken userToken = userTokenRepository
        .findByTokenAndTokenType(token, "EMAIL_VERIFICATION")
        .orElseThrow(() -> new InvalidTokenException(...));

    // 2. Check expiration
    if (userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
        throw new TokenExpiredException(...);
    }

    // 3. Check already used
    if (userToken.getUsedAt() != null) {
        throw new InvalidTokenException(...);
    }

    // 4. Get user
    User user = userToken.getUser();

    // 5. Idempotent check
    if (user.getEmailVerified()) {
        return success response; // Already verified
    }

    // 6. Verify user
    user.setEmailVerified(true);
    userRepository.save(user);

    // 7. Mark token as used
    userToken.setUsedAt(LocalDateTime.now());
    userTokenRepository.save(userToken);

    return success response;
}
```

### Controller Endpoint

```java
@GetMapping("/verify-email")
public ResponseEntity<VerifyEmailResponse> verifyEmail(
        @RequestParam("token") String token) {

    VerifyEmailResponse response = authService.verifyEmail(token);
    return ResponseEntity.ok(response);
}
```

## Integration with US-001

### Complete Registration Flow

1. **User Registration (US-001)**
   ```bash
   POST /api/v1/auth/register
   {
     "email": "user@example.com",
     "password": "SecurePass123!",
     ...
   }
   ```
   Response includes `emailVerified: false`

2. **System Actions**
   - User created with `email_verified=false`
   - Verification token generated (24h TTL)
   - Email sent with verification link

3. **User Verification (US-002)**
   ```bash
   GET /api/v1/auth/verify-email?token={token_from_email}
   ```
   Response: `"Email verified successfully. You can now log in."`

4. **Ready for Login (US-003)**
   - User can now authenticate
   - Login endpoint will check `email_verified=true`

## Security Considerations

### Token Security
- ✅ Tokens are UUIDs (cryptographically random)
- ✅ One-time use enforced (`used_at` check)
- ✅ Time-limited (24h expiration)
- ✅ Type-specific (`EMAIL_VERIFICATION`)

### Attack Vectors Prevented
1. **Token Reuse**: Prevented by `used_at` check
2. **Expired Token Use**: Prevented by expiration check
3. **Token Guessing**: UUID format (128-bit entropy)
4. **Brute Force**: Would require ~2^122 attempts
5. **Race Conditions**: `@Transactional` ensures atomicity

### Future Enhancements
- Rate limiting on verification endpoint
- IP tracking for verification attempts
- Email notification on suspicious activity
- Token blacklisting for reported abuse

## Verification

### Check User Status
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, email, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 5;"
```

### Check Token Status
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, user_id, token_type, expires_at, used_at FROM user_tokens ORDER BY created_at DESC LIMIT 5;"
```

### Find User's Verification Token
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT ut.token, ut.token_type, ut.expires_at, ut.used_at, u.email
      FROM user_tokens ut
      JOIN users u ON ut.user_id = u.id
      WHERE u.email = 'test@example.com'
      AND ut.token_type = 'EMAIL_VERIFICATION';"
```

## Testing Checklist

- [ ] Verify with valid token succeeds
- [ ] Verify with invalid token returns 400 INVALID_TOKEN
- [ ] Verify with expired token returns 400 TOKEN_EXPIRED
- [ ] Verify with already-used token returns 400 INVALID_TOKEN
- [ ] Verify when already verified returns 200 OK (idempotent)
- [ ] User `email_verified` set to true after verification
- [ ] Token `used_at` set to current timestamp after verification
- [ ] Token cannot be reused after first successful verification
- [ ] Email field returned in success response matches user email

## Error Scenarios

### Scenario 1: User Lost Email
**Problem:** User didn't receive verification email or lost it.

**Solution (Future):**
- Implement "Resend Verification Email" endpoint
- Generate new token, invalidate old one
- Rate limit to prevent abuse

### Scenario 2: Token Expired
**Problem:** User tries to verify after 24 hours.

**Solution:**
- User must register again OR
- Implement token regeneration endpoint

### Scenario 3: Email Changed
**Problem:** User wants to change email before verification.

**Solution (Future):**
- Allow email update for unverified users
- Generate new token for new email
- Invalidate old tokens

## Next Steps

1. ✅ User Registration (US-001) - IMPLEMENTED
2. ✅ Email Verification (US-002) - IMPLEMENTED
3. ⏳ Email Service Integration - SendGrid/Mailgun
4. ⏳ Login Endpoint (US-003) - JWT authentication
5. ⏳ Password Reset (US-004)
6. ⏳ Resend Verification Email endpoint
7. ⏳ Integration tests

## Related Documentation

- User Registration: `API-REGISTRATION.md`
- API Plan: `.ai/api-plan.md`
- Database Schema: `.ai/plan-db.md`
- PRD: `.ai/prd.md`
