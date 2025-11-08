# Favorite RCKiK API - Implementation Guide

## Implemented: US-009 - Favorite Blood Centers Management

### Overview
Endpoints for managing user's favorite blood donation centers. All endpoints require JWT authentication. Users can add, remove, and list their favorite RCKiK centers.

---

## Authentication Required

All endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer {your-access-token}
```

---

## Part 1: Get User's Favorites

### Endpoint
```
GET /api/v1/users/me/favorites
```

### Description
Returns list of authenticated user's favorite blood donation centers with current blood levels. Centers are ordered by priority (if set) then by date added (newest first).

### Request

**Method:** GET

**Headers:**
```
Authorization: Bearer eyJhbGci...
```

### Success Response

**Status Code:** `200 OK`

**Body:**
```json
[
  {
    "id": 1,
    "rckikId": 5,
    "name": "RCKiK Warszawa",
    "code": "RCKIK-WAW",
    "city": "Warszawa",
    "address": "ul. Kasprzaka 17, 01-211 Warszawa",
    "latitude": 52.2319,
    "longitude": 20.9728,
    "active": true,
    "priority": 1,
    "addedAt": "2025-01-01T10:00:00",
    "currentBloodLevels": [
      {
        "bloodGroup": "A+",
        "levelPercentage": 45.50,
        "levelStatus": "IMPORTANT",
        "lastUpdate": "2025-01-08T02:30:00"
      }
    ]
  }
]
```

**Field Descriptions:**
- `id`: Favorite entry unique identifier
- `rckikId`: RCKiK center ID (use for details/history)
- `priority`: Optional ordering (lower number = higher priority)
- `addedAt`: When user added to favorites
- `currentBloodLevels`: Latest blood levels for all blood groups
- Other fields: Same as RCKiK center information

**Empty List:**
If user has no favorites, returns empty array `[]`

### Error Responses

**401 Unauthorized:** JWT token missing or invalid

**404 Not Found:** User not found (deleted account)

### Testing with cURL

```bash
# Get access token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}' | \
  jq -r '.accessToken')

# Get favorites list
curl -X GET "http://localhost:8080/api/v1/users/me/favorites" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 2: Add Center to Favorites

### Endpoint
```
POST /api/v1/users/me/favorites/{rckikId}
```

### Description
Adds a blood donation center to authenticated user's favorites. Optional priority parameter for custom ordering.

### Request

**Method:** POST

**Path Parameters:**
- `rckikId` (required): RCKiK center ID to add

**Query Parameters:**
- `priority` (optional): Integer for ordering (lower = higher priority)

**Headers:**
```
Authorization: Bearer eyJhbGci...
```

**Examples:**
```
POST /api/v1/users/me/favorites/5
POST /api/v1/users/me/favorites/5?priority=1
```

### Success Response

**Status Code:** `201 Created`

**Body:**
```json
{
  "id": 1,
  "rckikId": 5,
  "name": "RCKiK Warszawa",
  "code": "RCKIK-WAW",
  "city": "Warszawa",
  "address": "ul. Kasprzaka 17, 01-211 Warszawa",
  "latitude": 52.2319,
  "longitude": 20.9728,
  "active": true,
  "priority": 1,
  "addedAt": "2025-01-08T20:00:00",
  "currentBloodLevels": [...]
}
```

### Error Responses

**400 Bad Request:**
Center already in favorites:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "RCKiK center is already in favorites",
  "path": "/api/v1/users/me/favorites/5"
}
```

**401 Unauthorized:** JWT token missing or invalid

**404 Not Found:** User or RCKiK center not found

### Testing with cURL

```bash
TOKEN="your-access-token"

# Add to favorites without priority
curl -X POST "http://localhost:8080/api/v1/users/me/favorites/5" \
  -H "Authorization: Bearer $TOKEN"

# Add with priority
curl -X POST "http://localhost:8080/api/v1/users/me/favorites/3?priority=1" \
  -H "Authorization: Bearer $TOKEN"

# Try to add duplicate (expect 400)
curl -X POST "http://localhost:8080/api/v1/users/me/favorites/5" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 3: Remove Center from Favorites

### Endpoint
```
DELETE /api/v1/users/me/favorites/{rckikId}
```

### Description
Removes a blood donation center from authenticated user's favorites.

### Request

**Method:** DELETE

**Path Parameters:**
- `rckikId` (required): RCKiK center ID to remove

**Headers:**
```
Authorization: Bearer eyJhbGci...
```

**Example:**
```
DELETE /api/v1/users/me/favorites/5
```

### Success Response

**Status Code:** `204 No Content`

**Body:** Empty

### Error Responses

**401 Unauthorized:** JWT token missing or invalid

**404 Not Found:**
Favorite not found:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 404,
  "error": "RESOURCE_NOT_FOUND",
  "message": "Favorite not found",
  "path": "/api/v1/users/me/favorites/999"
}
```

### Testing with cURL

```bash
TOKEN="your-access-token"

# Remove from favorites
curl -X DELETE "http://localhost:8080/api/v1/users/me/favorites/5" \
  -H "Authorization: Bearer $TOKEN"

# Try to remove non-existent (expect 404)
curl -X DELETE "http://localhost:8080/api/v1/users/me/favorites/999" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Impact

### Tables Modified

**`user_favorite_rckik`** - User favorites

**Add Favorite (POST):**
```sql
INSERT INTO user_favorite_rckik (user_id, rckik_id, priority, created_at)
VALUES (123, 5, 1, NOW());
```

**Remove Favorite (DELETE):**
```sql
DELETE FROM user_favorite_rckik
WHERE user_id = 123 AND rckik_id = 5;
```

**Get Favorites (GET):**
```sql
SELECT ufr.*, r.*, bs.*
FROM user_favorite_rckik ufr
JOIN rckik r ON r.id = ufr.rckik_id
LEFT JOIN blood_snapshots bs ON bs.id IN (
  -- Latest snapshot for each blood group
)
WHERE ufr.user_id = 123
ORDER BY ufr.priority ASC NULLS LAST, ufr.created_at DESC;
```

---

## Implementation Details

### Files Created/Modified

**DTO:**
- `FavoriteRckikDto.java` - Favorite center with priority and blood levels

**Repository:**
- `UserFavoriteRckikRepository.java` - Extended with ordering methods
  - `findByUserIdOrderByPriorityAscCreatedAtDesc()`
  - `countByUserId()`

**Service:**
- `FavoriteRckikService.java` - Business logic
  - `getUserFavorites(userId)` - Get list with blood levels
  - `addFavorite(userId, rckikId, priority)` - Add with validation
  - `removeFavorite(userId, rckikId)` - Remove with validation
  - `isFavorite(userId, rckikId)` - Check if favorited

**Controller:**
- `FavoriteRckikController.java` - REST endpoints
  - `GET /api/v1/users/me/favorites` - List
  - `POST /api/v1/users/me/favorites/{rckikId}` - Add
  - `DELETE /api/v1/users/me/favorites/{rckikId}` - Remove

**Security:**
- JWT authentication required for all endpoints
- User ID extracted from token (cannot be spoofed)
- Users can only manage their own favorites

### Business Logic

**Add Favorite:**
1. Verify user exists and is active
2. Verify RCKiK center exists
3. Check if already favorited (prevent duplicates)
4. Create favorite entry with optional priority
5. Return favorite with current blood levels

**Remove Favorite:**
1. Verify user exists
2. Check if favorite exists
3. Delete favorite entry
4. Return 204 No Content

**Get Favorites:**
1. Verify user exists
2. Fetch favorites ordered by priority, then date
3. Batch fetch blood levels for all favorites
4. Map to DTOs with blood levels
5. Return list (may be empty)

### Priority Ordering

- Lower number = higher priority
- Priority is optional (can be null)
- Ordering: `priority ASC NULLS LAST, created_at DESC`
- Example:
  - priority=1 (highest)
  - priority=2
  - priority=null (by date added, newest first)

---

## Use Cases

### Dashboard Quick Access
User can quickly access their favorite centers:
```bash
GET /api/v1/users/me/favorites
```

### Mark Nearby Center
User adds their local center:
```bash
POST /api/v1/users/me/favorites/5?priority=1
```

### Notifications Integration
System sends alerts only for favorited centers (US-010):
- Get user's favorites
- Check blood levels for CRITICAL status
- Send notifications

### Remove Old Favorites
User removes center they no longer use:
```bash
DELETE /api/v1/users/me/favorites/5
```

---

## Testing Checklist

### Get Favorites
- [ ] Valid token returns 200 with list
- [ ] Empty favorites returns empty array []
- [ ] Blood levels included for each center
- [ ] Ordered by priority then date
- [ ] No token returns 401
- [ ] Deleted user returns 404

### Add Favorite
- [ ] Valid request returns 201 with favorite
- [ ] Priority parameter works correctly
- [ ] Duplicate center returns 400
- [ ] Non-existent center returns 404
- [ ] No token returns 401
- [ ] Created entry appears in GET list

### Remove Favorite
- [ ] Valid request returns 204
- [ ] Non-existent favorite returns 404
- [ ] No token returns 401
- [ ] Removed entry disappears from GET list
- [ ] Idempotent (can't remove twice)

### Security
- [ ] JWT token properly validated
- [ ] User ID from token, not request
- [ ] Users can only manage own favorites
- [ ] Deleted users cannot access

---

## Integration with Other User Stories

### Prerequisites
- **US-001 (Registration)**: User must be registered
- **US-003 (Login)**: JWT token required
- **US-007 (List Centers)**: Provides RCKiK IDs to favorite

### Enables
- **US-010 (Email Notifications)**: Alerts for favorite centers only
- **US-011 (In-App Notifications)**: Notifications for favorites
- **Frontend Dashboard**: Quick access to favorite centers

---

## Next Steps

1. ✅ Browse Blood Centers (US-007) - IMPLEMENTED
2. ✅ View Center Details (US-008) - IMPLEMENTED
3. ✅ Favorite RCKiK Management (US-009) - IMPLEMENTED
4. ⏳ Email Notifications (US-010) - Uses favorites
5. ⏳ In-App Notifications (US-011) - Uses favorites
6. ⏳ Donation Diary (US-012) - May link to favorites

---

## Related Documentation

- List Blood Centers: `API-RCKIK-LIST.md`
- Center Details: `API-RCKIK-DETAILS.md`
- User Profile: `API-USER-PROFILE.md`
- Notification Preferences: `API-NOTIFICATION-PREFERENCES.md`
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md`
- PRD: `../.ai/prd.md`
