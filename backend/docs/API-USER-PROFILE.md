# User Profile API - Implementation Guide

## Implemented: US-005 - Edit User Profile

### Overview
User profile management consists of two endpoints for viewing and updating authenticated user's profile:
1. **Get User Profile**: Retrieve current user's profile information
2. **Update User Profile**: Partially update profile fields (except email)

---

## Authentication Required

Both endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer {your-access-token}
```

To obtain an access token, use the login endpoint (US-003):
```
POST /api/v1/auth/login
```

---

## Part 1: Get User Profile

### Endpoint
```
GET /api/v1/users/me
```

### Description
Returns profile information for the currently authenticated user. User ID is extracted from the JWT token.

### Request

**Method:** GET

**Headers:**
```
Authorization: Bearer eyJhbGci...
```

**No request body required**

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "emailVerified": true,
  "consentTimestamp": "2025-01-01T10:00:00",
  "consentVersion": "1.0",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-05T15:30:00"
}
```

**Field Descriptions:**
- `id`: User's unique identifier
- `email`: User's email address (cannot be changed)
- `firstName`: User's first name
- `lastName`: User's last name
- `bloodGroup`: Blood group (0+, 0-, A+, A-, B+, B-, AB+, AB-, or null)
- `emailVerified`: Whether email has been verified
- `consentTimestamp`: When user accepted privacy policy
- `consentVersion`: Version of privacy policy accepted
- `createdAt`: Account creation timestamp
- `updatedAt`: Last profile update timestamp

### Error Responses

#### Unauthorized (401)
Missing or invalid JWT token:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/v1/users/me"
}
```

#### Not Found (404)
User not found (deleted account):
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 404,
  "error": "RESOURCE_NOT_FOUND",
  "message": "User not found",
  "path": "/api/v1/users/me"
}
```

### Business Logic

1. **Extract User ID**: Get user ID from JWT token in SecurityContext
2. **Find User**: Look up user by ID (only active users, `deleted_at IS NULL`)
3. **Return Profile**: Map User entity to UserProfileResponse DTO

### Testing with cURL

```bash
# First, login to get access token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}' | \
  jq -r '.accessToken')

# Get user profile
curl -X GET "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "emailVerified": true,
  ...
}
```

---

## Part 2: Update User Profile

### Endpoint
```
PATCH /api/v1/users/me
```

### Description
Updates current user's profile. Only provided fields are updated (partial update). Email cannot be changed via this endpoint.

### Request

**Method:** PATCH

**Headers:**
```
Authorization: Bearer eyJhbGci...
Content-Type: application/json
```

**Request Body:**

All fields are optional. Only include fields you want to update:

```json
{
  "firstName": "Jan",
  "lastName": "Nowak",
  "bloodGroup": "B+"
}
```

**Request Validation:**
- `firstName`: Optional, max 100 characters
- `lastName`: Optional, max 100 characters
- `bloodGroup`: Optional, must be one of: "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-", or empty string (to clear)

**Note:** Email cannot be changed via this endpoint. Future implementation will require separate verification flow.

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Nowak",
  "bloodGroup": "B+",
  "emailVerified": true,
  "consentTimestamp": "2025-01-01T10:00:00",
  "consentVersion": "1.0",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-08T20:15:30"
}
```

**Note:** `updatedAt` timestamp is automatically updated when any field changes.

### Error Responses

#### Validation Error (400 Bad Request)
Invalid field values:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/users/me",
  "details": [
    {
      "field": "bloodGroup",
      "message": "Blood group must be one of: 0+, 0-, A+, A-, B+, B-, AB+, AB-, or empty",
      "rejectedValue": "XY+"
    }
  ]
}
```

#### Unauthorized (401)
Missing or invalid JWT token (same as GET endpoint)

#### Not Found (404)
User not found (same as GET endpoint)

### Business Logic

1. **Extract User ID**: Get user ID from JWT token
2. **Find User**: Look up user by ID (only active users)
3. **Partial Update**: Update only provided fields
   - `firstName`: Update if provided
   - `lastName`: Update if provided
   - `bloodGroup`: Update if provided (empty string becomes null)
4. **Update Timestamp**: Set `updated_at = NOW()` if any field changed
5. **Save**: Persist changes to database
6. **Return Updated Profile**: Return complete profile with updated values

### Testing with cURL

#### Update Single Field
```bash
TOKEN="your-access-token-here"

curl -X PATCH "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Janek"
  }'
```

#### Update Multiple Fields
```bash
curl -X PATCH "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jan",
    "lastName": "Nowak",
    "bloodGroup": "B+"
  }'
```

#### Clear Blood Group
```bash
curl -X PATCH "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bloodGroup": ""
  }'
```

#### Invalid Blood Group
```bash
curl -X PATCH "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bloodGroup": "invalid"
  }'
```

**Expected Response:**
```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [...]
}
```

---

## Database Impact

### Tables Modified

**`users`** - Profile fields updated

**Before:**
| id | email | first_name | last_name | blood_group | updated_at |
|----|-------|------------|-----------|-------------|------------|
| 123 | user@example.com | Jan | Kowalski | A+ | 2025-01-05 15:30:00 |

**After (updating firstName and bloodGroup):**
| id | email | first_name | last_name | blood_group | updated_at |
|----|-------|------------|-----------|-------------|------------|
| 123 | user@example.com | **Janek** | Kowalski | **B+** | **2025-01-08 20:15:30** |

**Changes:**
- Updated fields are modified
- `updated_at` timestamp is automatically set to current time
- `email` cannot be changed via this endpoint

---

## Implementation Details

### Files Created/Modified

**DTOs:**
- `UserProfileResponse.java` - Profile response with all user data
- `UpdateProfileRequest.java` - Partial update request with optional fields

**Service:**
- `UserService.java` - Business logic for profile operations
  - `getUserProfile(userId)` - Get user profile
  - `updateUserProfile(userId, request)` - Update user profile

**Controller:**
- `UserController.java` - REST endpoints
  - `GET /api/v1/users/me` - Get current user profile
  - `PATCH /api/v1/users/me` - Update current user profile

**Security:**
- `JwtAuthenticationFilter.java` - Extract user ID from JWT and set in SecurityContext
- `SecurityUtils.java` - Utility to get current user ID from SecurityContext
- `SecurityConfig.java` - Updated to include JWT filter

### Service Method

```java
@Transactional
public UserProfileResponse updateUserProfile(Long userId, UpdateProfileRequest request) {
    // Find user
    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    // Partial update - only update provided fields
    boolean updated = false;

    if (request.getFirstName() != null) {
        user.setFirstName(request.getFirstName());
        updated = true;
    }

    if (request.getLastName() != null) {
        user.setLastName(request.getLastName());
        updated = true;
    }

    if (request.getBloodGroup() != null) {
        String bloodGroup = request.getBloodGroup().trim().isEmpty()
            ? null
            : request.getBloodGroup();
        user.setBloodGroup(bloodGroup);
        updated = true;
    }

    // Update timestamp if any field changed
    if (updated) {
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    return mapToProfileResponse(user);
}
```

### Controller Endpoints

```java
@GetMapping("/me")
public ResponseEntity<UserProfileResponse> getCurrentUserProfile() {
    Long userId = SecurityUtils.getCurrentUserId();
    UserProfileResponse response = userService.getUserProfile(userId);
    return ResponseEntity.ok(response);
}

@PatchMapping("/me")
public ResponseEntity<UserProfileResponse> updateCurrentUserProfile(
        @Valid @RequestBody UpdateProfileRequest request) {
    Long userId = SecurityUtils.getCurrentUserId();
    UserProfileResponse response = userService.updateUserProfile(userId, request);
    return ResponseEntity.ok(response);
}
```

### JWT Authentication Flow

```
1. Client sends request with Authorization header
   ↓
2. JwtAuthenticationFilter extracts JWT token
   ↓
3. JwtTokenProvider validates token and extracts user ID
   ↓
4. Authentication object created with user ID as principal
   ↓
5. SecurityContext stores authentication
   ↓
6. Controller uses SecurityUtils.getCurrentUserId()
   ↓
7. Service performs business logic with user ID
```

---

## Security Considerations

### JWT Token Security
- ✅ Tokens validated on every request
- ✅ User ID extracted from token (cannot be spoofed)
- ✅ Stateless authentication (no server-side sessions)
- ✅ Short-lived access tokens (1 hour)

### Authorization
- ✅ Users can only access their own profile
- ✅ User ID from token, not from request parameters
- ✅ Prevents unauthorized access to other users' data

### Data Protection
- ✅ Email cannot be changed (prevents account hijacking)
- ✅ Deleted users cannot be accessed (`deleted_at IS NULL`)
- ✅ Input validation on all fields
- ✅ Password not included in profile responses

### Future Enhancements
- Email change with verification flow
- Profile picture upload
- Additional personal information fields
- Activity log for profile changes
- Two-factor authentication settings

---

## Verification Queries

### Check User Profile
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, email, first_name, last_name, blood_group, email_verified, updated_at
      FROM users
      WHERE id = 123;"
```

### Verify Profile Update
```bash
# Before update: Note the updated_at timestamp
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT first_name, last_name, blood_group, updated_at
      FROM users
      WHERE id = 123;"

# After update: Check fields and updated_at changed
```

---

## Testing Checklist

### Get User Profile
- [ ] Get profile with valid token returns 200 OK
- [ ] Profile data matches database
- [ ] Get profile without token returns 401 Unauthorized
- [ ] Get profile with invalid token returns 401 Unauthorized
- [ ] Get profile with expired token returns 401 Unauthorized
- [ ] Deleted user returns 404 Not Found

### Update User Profile
- [ ] Update firstName succeeds
- [ ] Update lastName succeeds
- [ ] Update bloodGroup succeeds
- [ ] Update multiple fields succeeds
- [ ] Clear bloodGroup (empty string) succeeds
- [ ] Invalid blood group returns 400 Validation Error
- [ ] firstName > 100 chars returns 400 Validation Error
- [ ] lastName > 100 chars returns 400 Validation Error
- [ ] Email field is ignored if provided
- [ ] Empty request body succeeds (no changes)
- [ ] `updated_at` timestamp updated on change
- [ ] `updated_at` NOT updated when no changes
- [ ] Update without token returns 401 Unauthorized

### Security
- [ ] User can only access own profile
- [ ] JWT token properly validated
- [ ] User ID extracted from token, not request
- [ ] Deleted users cannot access profile

---

## Integration with Other User Stories

### Prerequisites
- **US-001 (Registration)**: User must be registered
- **US-002 (Email Verification)**: Email must be verified
- **US-003 (Login)**: User must be logged in (JWT token required)

### Enables
- **US-006 (Notification Preferences)**: Profile info used in notifications
- **US-009 (Favorite RCKiK)**: User info displayed in favorites
- **US-012 (Donation Diary)**: User info in donation records

---

## Next Steps

1. ✅ User Registration (US-001) - IMPLEMENTED
2. ✅ Email Verification (US-002) - IMPLEMENTED
3. ✅ User Login (US-003) - IMPLEMENTED
4. ✅ Password Reset (US-004) - IMPLEMENTED
5. ✅ User Profile Management (US-005) - IMPLEMENTED
6. ⏳ Notification Preferences (US-006)
7. ⏳ Email change with verification flow
8. ⏳ Profile picture upload
9. ⏳ Integration tests for authenticated endpoints

---

## Related Documentation

- User Registration: `API-REGISTRATION.md`
- Email Verification: `API-EMAIL-VERIFICATION.md`
- User Login: `API-LOGIN.md`
- Password Reset: `API-PASSWORD-RESET.md`
- Swagger UI: `SWAGGER.md`
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md`
- PRD: `../.ai/prd.md`
