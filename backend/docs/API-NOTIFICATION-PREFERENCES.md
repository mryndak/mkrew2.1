# Notification Preferences API - Implementation Guide

## Implemented: US-006 - Notification Preferences

### Overview
Notification preferences management consists of two endpoints for viewing and updating authenticated user's notification settings:
1. **Get Notification Preferences**: Retrieve current user's notification settings
2. **Update Notification Preferences**: Configure email and in-app notification preferences

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

## Part 1: Get Notification Preferences

### Endpoint
```
GET /api/v1/users/me/notification-preferences
```

### Description
Returns notification preferences for the currently authenticated user. User ID is extracted from the JWT token. If preferences don't exist, they are auto-created with default values (one-to-one relationship with user).

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
  "id": 1,
  "userId": 123,
  "emailEnabled": true,
  "emailFrequency": "ONLY_CRITICAL",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-05T12:00:00"
}
```

**Field Descriptions:**
- `id`: Notification preferences unique identifier
- `userId`: User's unique identifier
- `emailEnabled`: Whether email notifications are enabled
- `emailFrequency`: Email notification frequency (DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE)
- `inAppEnabled`: Whether in-app notifications are enabled
- `inAppFrequency`: In-app notification frequency (DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE)
- `createdAt`: Preferences creation timestamp
- `updatedAt`: Last update timestamp

**Frequency Options Explained:**
- **DISABLED**: No notifications of this type
- **ONLY_CRITICAL**: Only critical alerts (blood level <20%)
- **DAILY**: Daily digest at configured time
- **IMMEDIATE**: Real-time notifications

### Error Responses

#### Unauthorized (401)
Missing or invalid JWT token:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/v1/users/me/notification-preferences"
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
  "path": "/api/v1/users/me/notification-preferences"
}
```

### Business Logic

1. **Extract User ID**: Get user ID from JWT token in SecurityContext
2. **Find User**: Look up user by ID (only active users, `deleted_at IS NULL`)
3. **Get or Create Preferences**:
   - If preferences exist, return them
   - If preferences don't exist, create with default values:
     - `emailEnabled=true`
     - `emailFrequency="ONLY_CRITICAL"`
     - `inAppEnabled=true`
     - `inAppFrequency="IMMEDIATE"`
4. **Return Response**: Map NotificationPreference entity to response DTO

### Testing with cURL

```bash
# First, login to get access token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}' | \
  jq -r '.accessToken')

# Get notification preferences
curl -X GET "http://localhost:8080/api/v1/users/me/notification-preferences" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "userId": 123,
  "emailEnabled": true,
  "emailFrequency": "ONLY_CRITICAL",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-01T10:00:00"
}
```

---

## Part 2: Update Notification Preferences

### Endpoint
```
PUT /api/v1/users/me/notification-preferences
```

### Description
Updates current user's notification preferences. This is a full update (PUT method) - all fields are required. If preferences don't exist, they will be created with the provided values.

### Request

**Method:** PUT

**Headers:**
```
Authorization: Bearer eyJhbGci...
Content-Type: application/json
```

**Request Body:**

All fields are required (PUT semantics - full update):

```json
{
  "emailEnabled": true,
  "emailFrequency": "DAILY",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE"
}
```

**Request Validation:**
- `emailEnabled`: Required, boolean
- `emailFrequency`: Required, must be one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"
- `inAppEnabled`: Required, boolean
- `inAppFrequency`: Required, must be one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"

**Note:** If `emailEnabled=false`, user will not receive any email notifications regardless of `emailFrequency` value. Same applies for in-app notifications.

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
{
  "id": 1,
  "userId": 123,
  "emailEnabled": true,
  "emailFrequency": "DAILY",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-08T20:15:30"
}
```

**Note:** `updatedAt` timestamp is automatically updated when preferences change.

### Error Responses

#### Validation Error (400 Bad Request)
Invalid field values:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/users/me/notification-preferences",
  "details": [
    {
      "field": "emailFrequency",
      "message": "Email frequency must be one of: DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE",
      "rejectedValue": "INVALID_VALUE"
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
3. **Get or Create Preferences**:
   - If preferences exist, update all fields
   - If preferences don't exist, create new with provided values
4. **Full Update**: Update all four fields (PUT semantics):
   - `emailEnabled`
   - `emailFrequency`
   - `inAppEnabled`
   - `inAppFrequency`
5. **Update Timestamp**: Set `updated_at = NOW()` automatically via @UpdateTimestamp
6. **Save**: Persist changes to database
7. **Return Updated Preferences**: Return complete preferences with updated values

### Testing with cURL

#### Update All Preferences
```bash
TOKEN="your-access-token-here"

curl -X PUT "http://localhost:8080/api/v1/users/me/notification-preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailFrequency": "DAILY",
    "inAppEnabled": true,
    "inAppFrequency": "IMMEDIATE"
  }'
```

#### Disable Email Notifications
```bash
curl -X PUT "http://localhost:8080/api/v1/users/me/notification-preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "emailFrequency": "DISABLED",
    "inAppEnabled": true,
    "inAppFrequency": "IMMEDIATE"
  }'
```

#### Only Critical Alerts
```bash
curl -X PUT "http://localhost:8080/api/v1/users/me/notification-preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailFrequency": "ONLY_CRITICAL",
    "inAppEnabled": true,
    "inAppFrequency": "ONLY_CRITICAL"
  }'
```

#### Invalid Frequency
```bash
curl -X PUT "http://localhost:8080/api/v1/users/me/notification-preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailFrequency": "INVALID",
    "inAppEnabled": true,
    "inAppFrequency": "IMMEDIATE"
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

**`notification_preferences`** - Preferences fields updated or created

**Before (default or not exists):**
| id | user_id | email_enabled | email_frequency | in_app_enabled | in_app_frequency | created_at | updated_at |
|----|---------|---------------|-----------------|----------------|------------------|------------|------------|
| - | - | - | - | - | - | - | - |

**After (auto-created on GET or updated on PUT):**
| id | user_id | email_enabled | email_frequency | in_app_enabled | in_app_frequency | created_at | updated_at |
|----|---------|---------------|-----------------|----------------|------------------|------------|------------|
| 1 | 123 | **true** | **DAILY** | **true** | **IMMEDIATE** | 2025-01-01 10:00:00 | **2025-01-08 20:15:30** |

**Changes:**
- Preferences created or updated with provided values
- `updated_at` timestamp is automatically set to current time
- One-to-one relationship with `users` table (unique constraint on `user_id`)

---

## Implementation Details

### Files Created/Modified

**DTOs:**
- `NotificationPreferencesResponse.java` - Response with all preference data
- `UpdateNotificationPreferencesRequest.java` - Full update request with all required fields

**Repository:**
- `NotificationPreferenceRepository.java` - Spring Data JPA repository
  - `findByUserId(userId)` - Find preferences by user ID
  - `existsByUserId(userId)` - Check if preferences exist

**Service:**
- `NotificationPreferenceService.java` - Business logic for preference operations
  - `getNotificationPreferences(userId)` - Get preferences, auto-create if not exists
  - `updateNotificationPreferences(userId, request)` - Update all preferences fields
  - `createDefaultPreferences(user)` - Create default preferences (private helper)

**Controller:**
- `NotificationPreferenceController.java` - REST endpoints
  - `GET /api/v1/users/me/notification-preferences` - Get current user preferences
  - `PUT /api/v1/users/me/notification-preferences` - Update current user preferences

**Entity:**
- `NotificationPreference.java` - JPA entity (already existed)

**Security:**
- Uses existing `JwtAuthenticationFilter` and `SecurityUtils` from US-005
- User ID extracted from JWT token (cannot be spoofed)

### Service Method

```java
@Transactional
public NotificationPreferencesResponse updateNotificationPreferences(
        Long userId,
        UpdateNotificationPreferencesRequest request) {
    // Find user
    User user = userRepository.findByIdAndDeletedAtIsNull(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    // Get or create preferences
    NotificationPreference preferences = notificationPreferenceRepository
        .findByUserId(userId)
        .orElseGet(() -> createDefaultPreferences(user));

    // Full update (PUT semantics)
    preferences.setEmailEnabled(request.getEmailEnabled());
    preferences.setEmailFrequency(request.getEmailFrequency());
    preferences.setInAppEnabled(request.getInAppEnabled());
    preferences.setInAppFrequency(request.getInAppFrequency());

    // Save (updated_at auto-set by @UpdateTimestamp)
    NotificationPreference savedPreferences = notificationPreferenceRepository.save(preferences);

    return mapToResponse(savedPreferences);
}

private NotificationPreference createDefaultPreferences(User user) {
    NotificationPreference preferences = NotificationPreference.builder()
        .user(user)
        .emailEnabled(true)
        .emailFrequency("ONLY_CRITICAL")
        .inAppEnabled(true)
        .inAppFrequency("IMMEDIATE")
        .build();

    return notificationPreferenceRepository.save(preferences);
}
```

### Controller Endpoints

```java
@GetMapping
public ResponseEntity<NotificationPreferencesResponse> getNotificationPreferences() {
    Long userId = SecurityUtils.getCurrentUserId();
    NotificationPreferencesResponse response = notificationPreferenceService
        .getNotificationPreferences(userId);
    return ResponseEntity.ok(response);
}

@PutMapping
public ResponseEntity<NotificationPreferencesResponse> updateNotificationPreferences(
        @Valid @RequestBody UpdateNotificationPreferencesRequest request) {
    Long userId = SecurityUtils.getCurrentUserId();
    NotificationPreferencesResponse response = notificationPreferenceService
        .updateNotificationPreferences(userId, request);
    return ResponseEntity.ok(response);
}
```

---

## Security Considerations

### JWT Token Security
- ✅ Tokens validated on every request
- ✅ User ID extracted from token (cannot be spoofed)
- ✅ Stateless authentication (no server-side sessions)
- ✅ Short-lived access tokens (1 hour)

### Authorization
- ✅ Users can only access their own preferences
- ✅ User ID from token, not from request parameters
- ✅ Prevents unauthorized access to other users' data

### Data Protection
- ✅ Deleted users cannot access preferences (`deleted_at IS NULL`)
- ✅ Input validation on all fields
- ✅ Enum validation for frequency values

### Database Constraints
- ✅ One-to-one relationship with users (unique constraint on `user_id`)
- ✅ Foreign key with ON DELETE CASCADE (preferences deleted with user)
- ✅ Check constraints on frequency values in database

### Future Enhancements
- Notification history tracking
- Scheduled daily digest configuration (specific time)
- Per-RCKiK notification preferences
- Push notification settings
- Notification delivery status tracking

---

## Notification Behavior

### Email Notifications

**If `emailEnabled=true`:**
- **DISABLED**: No emails sent
- **ONLY_CRITICAL**: Emails sent only when blood level <20%
- **DAILY**: Daily digest email at configured time (batch)
- **IMMEDIATE**: Real-time emails for critical alerts

**If `emailEnabled=false`:**
- No emails sent regardless of `emailFrequency` value

### In-App Notifications

**If `inAppEnabled=true`:**
- **DISABLED**: No in-app notifications created
- **ONLY_CRITICAL**: Notifications created only when blood level <20%
- **DAILY**: Notifications created in daily batch
- **IMMEDIATE**: Notifications created in real-time

**If `inAppEnabled=false`:**
- No in-app notifications created regardless of `inAppFrequency` value

### Opt-Out Capability
Users can completely opt-out of all notifications by setting:
```json
{
  "emailEnabled": false,
  "emailFrequency": "DISABLED",
  "inAppEnabled": false,
  "inAppFrequency": "DISABLED"
}
```

---

## Verification Queries

### Check User Preferences
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, user_id, email_enabled, email_frequency, in_app_enabled, in_app_frequency, updated_at
      FROM notification_preferences
      WHERE user_id = 123;"
```

### Verify Preferences Update
```bash
# Before update: Note the updated_at timestamp and values
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT email_enabled, email_frequency, in_app_enabled, in_app_frequency, updated_at
      FROM notification_preferences
      WHERE user_id = 123;"

# After update: Check fields and updated_at changed
```

### Check Default Preferences Creation
```bash
# Check if preferences were auto-created for new user
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT user_id, email_enabled, email_frequency, in_app_enabled, in_app_frequency
      FROM notification_preferences
      WHERE user_id = 123;"
```

---

## Testing Checklist

### Get Notification Preferences
- [ ] Get preferences with valid token returns 200 OK
- [ ] Preferences data matches database
- [ ] Get preferences without token returns 401 Unauthorized
- [ ] Get preferences with invalid token returns 401 Unauthorized
- [ ] Get preferences with expired token returns 401 Unauthorized
- [ ] Deleted user returns 404 Not Found
- [ ] Auto-creates default preferences if not exists
- [ ] Default values: emailEnabled=true, emailFrequency="ONLY_CRITICAL", inAppEnabled=true, inAppFrequency="IMMEDIATE"

### Update Notification Preferences
- [ ] Update all fields succeeds
- [ ] Update to DISABLED frequency succeeds
- [ ] Update to ONLY_CRITICAL frequency succeeds
- [ ] Update to DAILY frequency succeeds
- [ ] Update to IMMEDIATE frequency succeeds
- [ ] Disable email notifications succeeds
- [ ] Disable in-app notifications succeeds
- [ ] Complete opt-out succeeds (all disabled)
- [ ] Invalid email frequency returns 400 Validation Error
- [ ] Invalid in-app frequency returns 400 Validation Error
- [ ] Missing required field returns 400 Validation Error
- [ ] `updated_at` timestamp updated on change
- [ ] Update without token returns 401 Unauthorized
- [ ] Creates preferences if not exist (with provided values)

### Security
- [ ] User can only access own preferences
- [ ] JWT token properly validated
- [ ] User ID extracted from token, not request
- [ ] Deleted users cannot access preferences

### Business Logic
- [ ] One-to-one relationship with users enforced
- [ ] Frequency enum validation works correctly
- [ ] emailEnabled=false prevents all emails
- [ ] inAppEnabled=false prevents all in-app notifications
- [ ] Preferences persist across sessions

---

## Integration with Other User Stories

### Prerequisites
- **US-001 (Registration)**: User must be registered
- **US-002 (Email Verification)**: Email must be verified
- **US-003 (Login)**: User must be logged in (JWT token required)

### Enables
- **US-010 (Email Notifications)**: Email preferences control notification delivery
- **US-011 (In-App Notifications)**: In-app preferences control notification display
- **US-009 (Favorite RCKiK)**: Combined with favorites to determine which alerts to send

### Related Tables
- `notification_preferences` ↔ `users` (one-to-one)
- `email_logs` - Tracks email delivery based on preferences
- `in_app_notifications` - Created based on preferences
- `user_favorite_rckik` - Combined with preferences for targeted alerts

---

## Next Steps

1. ✅ User Registration (US-001) - IMPLEMENTED
2. ✅ Email Verification (US-002) - IMPLEMENTED
3. ✅ User Login (US-003) - IMPLEMENTED
4. ✅ Password Reset (US-004) - IMPLEMENTED
5. ✅ User Profile Management (US-005) - IMPLEMENTED
6. ✅ Notification Preferences (US-006) - IMPLEMENTED
7. ⏳ Favorite RCKiK Management (US-009)
8. ⏳ Email notification system implementation
9. ⏳ In-app notification system implementation
10. ⏳ Integration tests for notification preferences

---

## Related Documentation

- User Registration: `API-REGISTRATION.md`
- Email Verification: `API-EMAIL-VERIFICATION.md`
- User Login: `API-LOGIN.md`
- Password Reset: `API-PASSWORD-RESET.md`
- User Profile: `API-USER-PROFILE.md`
- Swagger UI: `SWAGGER.md`
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md`
- PRD: `../.ai/prd.md`
