# REST API Plan - mkrew MVP

## Document Information
- **Version:** 1.0
- **Date:** 2025-11-08
- **Status:** Draft
- **Tech Stack:** Java + Spring Boot, PostgreSQL, REST
- **Base URL:** `/api/v1`

---

## 1. Resources

### 1.1 Core Resources

| Resource | Database Table | Description | Access Level |
|----------|---------------|-------------|--------------|
| Users | `users` | User accounts and profiles | Authenticated users (self), Admin |
| RCKiK | `rckik` | Blood donation centers (canonical list) | Public (list/details), Admin (CRUD) |
| Blood Levels | `blood_snapshots`, `mv_latest_blood_levels` | Blood inventory snapshots and current levels | Public |
| Favorites | `user_favorite_rckik` | User's favorite RCKiK centers | Authenticated users (self) |
| Donations | `donations` | User donation diary entries | Authenticated users (self) |

### 1.2 Notification Resources

| Resource | Database Table | Description | Access Level |
|----------|---------------|-------------|--------------|
| Notification Preferences | `notification_preferences` | User notification settings | Authenticated users (self) |
| In-App Notifications | `in_app_notifications` | In-app notification messages | Authenticated users (self) |

### 1.3 Authentication Resources

| Resource | Database Table | Description | Access Level |
|----------|---------------|-------------|--------------|
| Auth | `users`, `user_tokens`, `user_sessions` | Authentication operations | Public (register, login), Authenticated (logout) |
| Tokens | `user_tokens` | Verification and reset tokens | System-generated |
| Sessions | `user_sessions` | User sessions (optional for MVP) | Authenticated users (self) |

### 1.4 Admin Resources

| Resource | Database Table | Description | Access Level |
|----------|---------------|-------------|--------------|
| Scraper Runs | `scraper_runs` | Web scraping execution runs | Admin only |
| Scraper Logs | `scraper_logs` | Individual scraping operation logs | Admin only |
| Scraper Configs | `scraper_configs` | Scraper configurations per RCKiK | Admin only |
| User Reports | `user_reports` | User-submitted data issue reports | Authenticated (create), Admin (manage) |
| Email Logs | `email_logs` | Email delivery tracking | Admin only |
| Audit Logs | `audit_logs` | Immutable audit trail | Admin only (read) |

---

## 2. Endpoints

### 2.1 Authentication Endpoints

#### Register New User
**US-001: User Registration**

- **Method:** POST
- **Path:** `/api/v1/auth/register`
- **Description:** Register a new user account with email verification flow
- **Authentication:** None (public)
- **Rate Limit:** 5 requests per IP per hour

**Request Body:**
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

**Request Validation:**
- `email`: Required, valid email format, unique, max 255 chars
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special char
- `firstName`: Required, max 100 chars
- `lastName`: Required, max 100 chars
- `bloodGroup`: Optional, must be one of: "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"
- `favoriteRckikIds`: Optional, array of valid RCKiK IDs
- `consentVersion`: Required, current privacy policy version
- `consentAccepted`: Required, must be true

**Success Response (201 Created):**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "emailVerified": false,
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is already registered"
      }
    ]
  }
  ```
- `429 Too Many Requests`: Rate limit exceeded

**Business Logic:**
1. Hash password using Argon2/BCrypt
2. Create user with `email_verified=false`
3. Generate EMAIL_VERIFICATION token (24h TTL)
4. Send verification email
5. Record consent with timestamp

---

#### Verify Email
**US-002: Email Verification**

- **Method:** GET
- **Path:** `/api/v1/auth/verify-email`
- **Description:** Verify user email address using token from email
- **Authentication:** None (public)
- **Query Parameters:**
  - `token` (required): Verification token from email

**Success Response (200 OK):**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token
  ```json
  {
    "error": "INVALID_TOKEN",
    "message": "Verification token is invalid or has expired"
  }
  ```
- `404 Not Found`: Token not found

**Business Logic:**
1. Validate token exists and not expired (24h)
2. Check token not already used (`used_at IS NULL`)
3. Mark user as `email_verified=true`
4. Mark token as used (`used_at=NOW()`)
5. Idempotent: If already verified, return success

---

#### Login
**US-003: User Login**

- **Method:** POST
- **Path:** `/api/v1/auth/login`
- **Description:** Authenticate user and receive JWT token
- **Authentication:** None (public)
- **Rate Limit:** 5 failed attempts per email triggers temporary lockout (5 minutes)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "refresh_token_here",
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

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "error": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
  ```
- `403 Forbidden`: Email not verified
  ```json
  {
    "error": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email before logging in"
  }
  ```
- `429 Too Many Requests`: Too many failed attempts
  ```json
  {
    "error": "TOO_MANY_ATTEMPTS",
    "message": "Account temporarily locked. Please try again in 5 minutes.",
    "retryAfter": 300
  }
  ```

**Business Logic:**
1. Validate email exists and is active (`deleted_at IS NULL`)
2. Check `email_verified=true`
3. Verify password hash
4. Track failed login attempts
5. Generate JWT with user_id, role, email
6. Optionally create session in `user_sessions` table
7. Reset failed attempt counter on success

---

#### Logout
- **Method:** POST
- **Path:** `/api/v1/auth/logout`
- **Description:** Invalidate current session/token
- **Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Business Logic:**
1. If using `user_sessions` table: mark session as revoked
2. Client should discard token
3. JWT blacklisting can be implemented if needed

---

#### Request Password Reset
**US-004: Password Reset Flow (Part 1)**

- **Method:** POST
- **Path:** `/api/v1/auth/password-reset/request`
- **Description:** Request password reset token via email
- **Authentication:** None (public)
- **Rate Limit:** 3 requests per email per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Business Logic:**
1. Check if email exists (don't reveal if not exists - security)
2. Generate PASSWORD_RESET token (1h TTL)
3. Send email with reset link
4. Always return success (prevent email enumeration)

---

#### Confirm Password Reset
**US-004: Password Reset Flow (Part 2)**

- **Method:** POST
- **Path:** `/api/v1/auth/password-reset/confirm`
- **Description:** Reset password using token from email
- **Authentication:** None (public)

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

**Request Validation:**
- `token`: Required
- `newPassword`: Required, same rules as registration

**Success Response (200 OK):**
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token, weak password
- `404 Not Found`: Token not found

**Business Logic:**
1. Validate token exists, not expired (1h), not used
2. Hash new password
3. Update user password
4. Mark token as used
5. Invalidate all existing sessions for this user
6. Send confirmation email

---

### 2.2 User Profile Endpoints

#### Get Current User Profile
**US-005: View Profile**

- **Method:** GET
- **Path:** `/api/v1/users/me`
- **Description:** Get current authenticated user's profile
- **Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "emailVerified": true,
  "consentTimestamp": "2025-01-01T10:00:00Z",
  "consentVersion": "1.0",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-05T15:30:00Z"
}
```

---

#### Update User Profile
**US-005: Edit Profile**

- **Method:** PATCH
- **Path:** `/api/v1/users/me`
- **Description:** Update current user's profile (partial update)
- **Authentication:** Required (JWT)

**Request Body:**
```json
{
  "firstName": "Jan",
  "lastName": "Nowak",
  "bloodGroup": "B+"
}
```

**Request Validation:**
- `firstName`: Optional, max 100 chars
- `lastName`: Optional, max 100 chars
- `bloodGroup`: Optional, must be valid blood group or null
- `email`: Cannot be changed via this endpoint (requires separate verification flow)

**Success Response (200 OK):**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Nowak",
  "bloodGroup": "B+",
  "updatedAt": "2025-01-08T14:20:00Z"
}
```

**Business Logic:**
1. Only update provided fields
2. Update `updated_at` timestamp
3. Validate blood group if provided

---

#### Delete User Account
**US-016: Right to be Forgotten**

- **Method:** DELETE
- **Path:** `/api/v1/users/me`
- **Description:** Soft delete user account and initiate data deletion process
- **Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "message": "Account deletion initiated. You will receive confirmation via email.",
  "deletionScheduledAt": "2025-01-08T15:00:00Z"
}
```

**Business Logic:**
1. Soft delete: Set `deleted_at=NOW()`
2. Create audit log entry (ACCOUNT_DELETED)
3. Send confirmation email
4. Cascade deletes: donations, favorites, notifications (ON DELETE CASCADE)
5. Keep audit logs for compliance
6. Invalidate all sessions

---

### 2.3 Notification Preferences Endpoints

#### Get Notification Preferences
**US-006: View Preferences**

- **Method:** GET
- **Path:** `/api/v1/users/me/notification-preferences`
- **Description:** Get user's notification preferences
- **Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "userId": 123,
  "emailEnabled": true,
  "emailFrequency": "ONLY_CRITICAL",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-05T12:00:00Z"
}
```

**Business Logic:**
1. Auto-create default preferences if not exists (one-to-one with user)

---

#### Update Notification Preferences
**US-006: Configure Preferences**

- **Method:** PUT
- **Path:** `/api/v1/users/me/notification-preferences`
- **Description:** Update user's notification preferences (full update)
- **Authentication:** Required (JWT)

**Request Body:**
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
- `emailFrequency`: Required, one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"
- `inAppEnabled`: Required, boolean
- `inAppFrequency`: Required, one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"

**Success Response (200 OK):**
```json
{
  "userId": 123,
  "emailEnabled": true,
  "emailFrequency": "DAILY",
  "inAppEnabled": true,
  "inAppFrequency": "IMMEDIATE",
  "updatedAt": "2025-01-08T15:30:00Z"
}
```

---

### 2.4 RCKiK (Blood Center) Endpoints

#### List RCKiK Centers
**US-007: Browse Blood Centers**

- **Method:** GET
- **Path:** `/api/v1/rckik`
- **Description:** Get list of blood donation centers with current blood levels
- **Authentication:** None (public)
- **Query Parameters:**
  - `page` (optional, default: 0): Page number
  - `size` (optional, default: 20, max: 100): Page size
  - `city` (optional): Filter by city
  - `active` (optional, default: true): Filter by active status
  - `sortBy` (optional, default: "name"): Sort field (name, city, code)
  - `sortOrder` (optional, default: "ASC"): Sort order (ASC, DESC)

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie",
      "code": "RCKIK-WAW",
      "city": "Warszawa",
      "address": "ul. Kasprzaka 17, 01-211 Warszawa",
      "latitude": 52.2319,
      "longitude": 20.9728,
      "active": true,
      "bloodLevels": [
        {
          "bloodGroup": "A+",
          "levelPercentage": 45.50,
          "levelStatus": "IMPORTANT",
          "lastUpdate": "2025-01-08T02:30:00Z"
        },
        {
          "bloodGroup": "0-",
          "levelPercentage": 15.00,
          "levelStatus": "CRITICAL",
          "lastUpdate": "2025-01-08T02:30:00Z"
        }
      ]
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

**Business Logic:**
1. Query `mv_latest_blood_levels` for current levels
2. Filter active centers by default
3. Include blood levels with status: CRITICAL (<20%), IMPORTANT (<50%), OK (>=50%)

---

#### Get RCKiK Details
**US-008: View Center Details and History**

- **Method:** GET
- **Path:** `/api/v1/rckik/{id}`
- **Description:** Get detailed information about specific blood center
- **Authentication:** None (public)
- **Path Parameters:**
  - `id`: RCKiK ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie",
  "code": "RCKIK-WAW",
  "city": "Warszawa",
  "address": "ul. Kasprzaka 17, 01-211 Warszawa",
  "latitude": 52.2319,
  "longitude": 20.9728,
  "aliases": ["RCKiK Warszawa", "RCKIK WAW"],
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2025-01-05T10:00:00Z",
  "currentBloodLevels": [
    {
      "bloodGroup": "A+",
      "levelPercentage": 45.50,
      "levelStatus": "IMPORTANT",
      "snapshotDate": "2025-01-08",
      "scrapedAt": "2025-01-08T02:30:00Z"
    }
  ],
  "lastSuccessfulScrape": "2025-01-08T02:30:00Z",
  "scrapingStatus": "OK"
}
```

**Error Responses:**
- `404 Not Found`: RCKiK not found

---

#### Get Blood Level History for RCKiK
**US-008: View Trends**

- **Method:** GET
- **Path:** `/api/v1/rckik/{id}/blood-levels`
- **Description:** Get historical blood level snapshots for a center
- **Authentication:** None (public)
- **Path Parameters:**
  - `id`: RCKiK ID
- **Query Parameters:**
  - `bloodGroup` (optional): Filter by blood group
  - `fromDate` (optional): Start date (ISO 8601)
  - `toDate` (optional): End date (ISO 8601)
  - `page` (optional, default: 0)
  - `size` (optional, default: 30, max: 100)

**Success Response (200 OK):**
```json
{
  "rckikId": 1,
  "rckikName": "RCKiK Warszawa",
  "snapshots": [
    {
      "id": 1001,
      "snapshotDate": "2025-01-08",
      "bloodGroup": "A+",
      "levelPercentage": 45.50,
      "levelStatus": "IMPORTANT",
      "scrapedAt": "2025-01-08T02:30:00Z",
      "isManual": false
    },
    {
      "id": 1000,
      "snapshotDate": "2025-01-07",
      "bloodGroup": "A+",
      "levelPercentage": 52.00,
      "levelStatus": "OK",
      "scrapedAt": "2025-01-07T02:30:00Z",
      "isManual": false
    }
  ],
  "page": 0,
  "size": 30,
  "totalElements": 240
}
```

---

### 2.5 Favorite RCKiK Endpoints

#### List User's Favorite RCKiK
**US-009: View Favorites**

- **Method:** GET
- **Path:** `/api/v1/users/me/favorites`
- **Description:** Get user's favorite blood centers
- **Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "favorites": [
    {
      "id": 10,
      "rckik": {
        "id": 1,
        "name": "RCKiK Warszawa",
        "code": "RCKIK-WAW",
        "city": "Warszawa"
      },
      "priority": 1,
      "addedAt": "2025-01-01T12:00:00Z"
    },
    {
      "id": 11,
      "rckik": {
        "id": 3,
        "name": "RCKiK Kraków",
        "code": "RCKIK-KRK",
        "city": "Kraków"
      },
      "priority": null,
      "addedAt": "2025-01-02T14:00:00Z"
    }
  ]
}
```

---

#### Add Favorite RCKiK
**US-009: Add to Favorites**

- **Method:** POST
- **Path:** `/api/v1/users/me/favorites`
- **Description:** Add a blood center to user's favorites
- **Authentication:** Required (JWT)

**Request Body:**
```json
{
  "rckikId": 1,
  "priority": 1
}
```

**Request Validation:**
- `rckikId`: Required, must exist in `rckik` table
- `priority`: Optional, integer

**Success Response (201 Created):**
```json
{
  "id": 10,
  "rckik": {
    "id": 1,
    "name": "RCKiK Warszawa",
    "code": "RCKIK-WAW",
    "city": "Warszawa"
  },
  "priority": 1,
  "addedAt": "2025-01-08T15:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid rckikId or already favorited
  ```json
  {
    "error": "ALREADY_FAVORITED",
    "message": "This RCKiK is already in your favorites"
  }
  ```
- `404 Not Found`: RCKiK not found

**Business Logic:**
1. Check unique constraint (user_id, rckik_id)
2. Affects notification eligibility for this center

---

#### Remove Favorite RCKiK
**US-009: Remove from Favorites**

- **Method:** DELETE
- **Path:** `/api/v1/users/me/favorites/{rckikId}`
- **Description:** Remove a blood center from user's favorites
- **Authentication:** Required (JWT)
- **Path Parameters:**
  - `rckikId`: RCKiK ID to remove

**Success Response (204 No Content)**

**Error Responses:**
- `404 Not Found`: Favorite not found

---

### 2.6 Donation Diary Endpoints

#### List User's Donations
**US-012, US-014: View Donation History**

- **Method:** GET
- **Path:** `/api/v1/users/me/donations`
- **Description:** Get user's donation history
- **Authentication:** Required (JWT)
- **Query Parameters:**
  - `fromDate` (optional): Filter from date (ISO 8601)
  - `toDate` (optional): Filter to date (ISO 8601)
  - `rckikId` (optional): Filter by RCKiK
  - `page` (optional, default: 0)
  - `size` (optional, default: 20, max: 100)
  - `sortBy` (optional, default: "donationDate"): Sort field
  - `sortOrder` (optional, default: "DESC"): Sort order

**Success Response (200 OK):**
```json
{
  "donations": [
    {
      "id": 501,
      "rckik": {
        "id": 1,
        "name": "RCKiK Warszawa",
        "code": "RCKIK-WAW"
      },
      "donationDate": "2025-01-05",
      "quantityMl": 450,
      "donationType": "FULL_BLOOD",
      "notes": "Czułem się dobrze po donacji",
      "confirmed": true,
      "createdAt": "2025-01-05T14:30:00Z",
      "updatedAt": "2025-01-05T14:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 12,
  "statistics": {
    "totalDonations": 12,
    "totalQuantityMl": 5400,
    "lastDonationDate": "2025-01-05"
  }
}
```

**Business Logic:**
1. Only return user's own donations (filtered by user_id from JWT)
2. Exclude soft-deleted donations (`deleted_at IS NULL`)

---

#### Create Donation
**US-012: Add Donation Entry**

- **Method:** POST
- **Path:** `/api/v1/users/me/donations`
- **Description:** Add new donation to user's diary
- **Authentication:** Required (JWT)

**Request Body:**
```json
{
  "rckikId": 1,
  "donationDate": "2025-01-08",
  "quantityMl": 450,
  "donationType": "FULL_BLOOD",
  "notes": "Felt great, quick process"
}
```

**Request Validation:**
- `rckikId`: Required, must exist
- `donationDate`: Required, ISO 8601 date, cannot be future date
- `quantityMl`: Required, integer, range 50-1000
- `donationType`: Required, one of: "FULL_BLOOD", "PLASMA", "PLATELETS", "OTHER"
- `notes`: Optional, max 1000 chars

**Success Response (201 Created):**
```json
{
  "id": 502,
  "rckik": {
    "id": 1,
    "name": "RCKiK Warszawa",
    "code": "RCKIK-WAW"
  },
  "donationDate": "2025-01-08",
  "quantityMl": 450,
  "donationType": "FULL_BLOOD",
  "notes": "Felt great, quick process",
  "confirmed": false,
  "createdAt": "2025-01-08T16:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors

**Business Logic:**
1. Set confirmed=false by default
2. Associate with authenticated user (user_id from JWT)

---

#### Update Donation
**US-013: Edit Donation**

- **Method:** PATCH
- **Path:** `/api/v1/users/me/donations/{id}`
- **Description:** Update existing donation (partial update)
- **Authentication:** Required (JWT)
- **Path Parameters:**
  - `id`: Donation ID

**Request Body:**
```json
{
  "quantityMl": 500,
  "notes": "Updated notes"
}
```

**Request Validation:**
- Same validation rules as create (for provided fields)
- Cannot change `rckikId` or `donationDate` (business rule)

**Success Response (200 OK):**
```json
{
  "id": 502,
  "rckik": {
    "id": 1,
    "name": "RCKiK Warszawa",
    "code": "RCKIK-WAW"
  },
  "donationDate": "2025-01-08",
  "quantityMl": 500,
  "donationType": "FULL_BLOOD",
  "notes": "Updated notes",
  "confirmed": false,
  "updatedAt": "2025-01-08T16:30:00Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not owner of donation
- `404 Not Found`: Donation not found or deleted

**Business Logic:**
1. Verify user_id matches authenticated user
2. Update only provided fields
3. Update `updated_at` timestamp

---

#### Delete Donation
**US-013: Remove Donation**

- **Method:** DELETE
- **Path:** `/api/v1/users/me/donations/{id}`
- **Description:** Soft delete a donation entry
- **Authentication:** Required (JWT)
- **Path Parameters:**
  - `id`: Donation ID

**Success Response (204 No Content)**

**Error Responses:**
- `403 Forbidden`: Not owner of donation
- `404 Not Found`: Donation not found

**Business Logic:**
1. Verify user_id matches authenticated user
2. Soft delete: Set `deleted_at=NOW()`
3. Create audit log entry (DONATION_DELETED)
4. Require confirmation in UI before deletion

---

#### Export Donations
**US-014: Export to CSV/JSON**

- **Method:** GET
- **Path:** `/api/v1/users/me/donations/export`
- **Description:** Export user's donation history
- **Authentication:** Required (JWT)
- **Query Parameters:**
  - `format` (required): Export format ("csv" or "json")
  - `fromDate` (optional): Filter from date
  - `toDate` (optional): Filter to date

**Success Response (200 OK):**

For `format=csv`:
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="donations_export_20250108.csv"

Donation Date,RCKiK Name,RCKiK City,Quantity (ml),Donation Type,Notes,Confirmed
2025-01-08,RCKiK Warszawa,Warszawa,450,FULL_BLOOD,Felt great,false
2025-01-05,RCKiK Warszawa,Warszawa,450,FULL_BLOOD,Good experience,true
```

For `format=json`:
```json
Content-Type: application/json
Content-Disposition: attachment; filename="donations_export_20250108.json"

{
  "userId": 123,
  "exportDate": "2025-01-08T16:45:00Z",
  "donations": [
    {
      "donationDate": "2025-01-08",
      "rckikName": "RCKiK Warszawa",
      "rckikCity": "Warszawa",
      "quantityMl": 450,
      "donationType": "FULL_BLOOD",
      "notes": "Felt great",
      "confirmed": false
    }
  ],
  "totalDonations": 12,
  "totalQuantityMl": 5400
}
```

**Error Responses:**
- `400 Bad Request`: Invalid format parameter

**Business Logic:**
1. Filter by user_id (authenticated user)
2. Exclude soft-deleted donations
3. For MVP: Synchronous generation
4. Future: Async with download link (for large datasets)

---

### 2.7 In-App Notification Endpoints

#### List In-App Notifications
**US-011: View Notifications**

- **Method:** GET
- **Path:** `/api/v1/users/me/notifications`
- **Description:** Get user's in-app notifications
- **Authentication:** Required (JWT)
- **Query Parameters:**
  - `unreadOnly` (optional, default: false): Show only unread
  - `page` (optional, default: 0)
  - `size` (optional, default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 301,
      "type": "CRITICAL_BLOOD_LEVEL",
      "rckik": {
        "id": 1,
        "name": "RCKiK Warszawa"
      },
      "title": "Critical Blood Level Alert",
      "message": "Blood type 0- is critically low (15%) at RCKiK Warszawa",
      "linkUrl": "/rckik/1",
      "readAt": null,
      "expiresAt": "2025-01-15T00:00:00Z",
      "createdAt": "2025-01-08T03:00:00Z"
    },
    {
      "id": 300,
      "type": "DONATION_REMINDER",
      "rckik": null,
      "title": "Time to Donate",
      "message": "It's been 3 months since your last donation. Consider donating again!",
      "linkUrl": "/donations/new",
      "readAt": "2025-01-07T10:00:00Z",
      "expiresAt": null,
      "createdAt": "2025-01-07T08:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 15,
  "unreadCount": 3
}
```

**Business Logic:**
1. Filter by user_id (authenticated user)
2. Optionally filter unread (`read_at IS NULL`)
3. Exclude expired notifications (optional)

---

#### Mark Notification as Read
- **Method:** PATCH
- **Path:** `/api/v1/users/me/notifications/{id}`
- **Description:** Mark a notification as read
- **Authentication:** Required (JWT)
- **Path Parameters:**
  - `id`: Notification ID

**Request Body:**
```json
{
  "readAt": "2025-01-08T17:00:00Z"
}
```

**Success Response (200 OK):**
```json
{
  "id": 301,
  "type": "CRITICAL_BLOOD_LEVEL",
  "title": "Critical Blood Level Alert",
  "readAt": "2025-01-08T17:00:00Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not owner of notification
- `404 Not Found`: Notification not found

---

#### Get Unread Notification Count
- **Method:** GET
- **Path:** `/api/v1/users/me/notifications/unread-count`
- **Description:** Get count of unread notifications (for badge)
- **Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "unreadCount": 3
}
```

---

### 2.8 Blood Levels Endpoints

#### Get Latest Blood Levels (Dashboard)
**US-007: Dashboard View**

- **Method:** GET
- **Path:** `/api/v1/blood-levels/latest`
- **Description:** Get latest blood levels for all RCKiK (optimized for dashboard)
- **Authentication:** None (public)
- **Query Parameters:**
  - `levelStatus` (optional): Filter by status ("CRITICAL", "IMPORTANT", "OK")
  - `bloodGroup` (optional): Filter by blood group
  - `city` (optional): Filter by city
  - `page` (optional, default: 0)
  - `size` (optional, default: 50)

**Success Response (200 OK):**
```json
{
  "bloodLevels": [
    {
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "rckikCode": "RCKIK-WAW",
      "rckikCity": "Warszawa",
      "bloodGroup": "0-",
      "levelPercentage": 15.00,
      "levelStatus": "CRITICAL",
      "snapshotDate": "2025-01-08",
      "scrapedAt": "2025-01-08T02:30:00Z",
      "isManual": false
    },
    {
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "rckikCode": "RCKIK-WAW",
      "rckikCity": "Warszawa",
      "bloodGroup": "A+",
      "levelPercentage": 45.50,
      "levelStatus": "IMPORTANT",
      "snapshotDate": "2025-01-08",
      "scrapedAt": "2025-01-08T02:30:00Z",
      "isManual": false
    }
  ],
  "page": 0,
  "size": 50,
  "totalElements": 160,
  "lastUpdated": "2025-01-08T02:30:00Z"
}
```

**Business Logic:**
1. Query `mv_latest_blood_levels` materialized view for performance
2. Filter active RCKiK only
3. Computed field `levelStatus`: CRITICAL (<20%), IMPORTANT (<50%), OK (>=50%)

---

### 2.9 User Reports Endpoints

#### Create Report
**US-021: Report Data Issue**

- **Method:** POST
- **Path:** `/api/v1/reports`
- **Description:** Submit a data quality issue report
- **Authentication:** Required (JWT)

**Request Body:**
```json
{
  "rckikId": 1,
  "bloodSnapshotId": 1001,
  "description": "The blood level for A+ seems incorrect. Yesterday it was 50%, today it shows 10% which seems unlikely.",
  "screenshotUrl": "https://storage.googleapis.com/mkrew-uploads/screenshots/abc123.png"
}
```

**Request Validation:**
- `rckikId`: Required, must exist
- `bloodSnapshotId`: Optional, must exist if provided
- `description`: Required, max 2000 chars
- `screenshotUrl`: Optional, valid URL

**Success Response (201 Created):**
```json
{
  "id": 701,
  "rckikId": 1,
  "bloodSnapshotId": 1001,
  "description": "The blood level for A+ seems incorrect...",
  "screenshotUrl": "https://storage.googleapis.com/...",
  "status": "NEW",
  "createdAt": "2025-01-08T17:00:00Z"
}
```

**Business Logic:**
1. Set status=NEW
2. Associate with authenticated user
3. Future: Send notification to admins

---

### 2.10 Donation Confirmation Endpoint

#### Confirm Donation from Email
**US-027: One-Click Donation Confirmation**

- **Method:** GET
- **Path:** `/api/v1/donations/confirm`
- **Description:** Confirm donation via token from email (one-time link)
- **Authentication:** None (token-based)
- **Query Parameters:**
  - `token` (required): Confirmation token from email

**Success Response (200 OK):**
```json
{
  "message": "Donation confirmed successfully",
  "donation": {
    "id": 502,
    "donationDate": "2025-01-08",
    "rckikName": "RCKiK Warszawa",
    "quantityMl": 450,
    "confirmed": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token
- `404 Not Found`: Token not found

**Business Logic:**
1. Validate token type=DONATION_CONFIRMATION
2. Check not expired, not used
3. Find or create donation record
4. Mark as confirmed=true
5. Mark token as used
6. Idempotent: If already confirmed, return success

---

### 2.11 Admin Endpoints

#### Admin - List RCKiK Centers
**US-019: Admin RCKiK Management**

- **Method:** GET
- **Path:** `/api/v1/admin/rckik`
- **Description:** Get all RCKiK centers (including inactive)
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:** Same as public endpoint, but no default filter on `active`

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "name": "RCKiK Warszawa",
      "code": "RCKIK-WAW",
      "city": "Warszawa",
      "address": "ul. Kasprzaka 17, 01-211 Warszawa",
      "latitude": 52.2319,
      "longitude": 20.9728,
      "aliases": ["RCKiK Warszawa", "RCKIK WAW"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2025-01-05T10:00:00Z"
    }
  ],
  "page": 0,
  "totalElements": 52
}
```

---

#### Admin - Create RCKiK Center
**US-019: Add New Center**

- **Method:** POST
- **Path:** `/api/v1/admin/rckik`
- **Description:** Create new blood center
- **Authentication:** Required (JWT, role=ADMIN)

**Request Body:**
```json
{
  "name": "RCKiK Gdańsk",
  "code": "RCKIK-GDA",
  "city": "Gdańsk",
  "address": "ul. Przykładowa 10, 80-001 Gdańsk",
  "latitude": 54.3520,
  "longitude": 18.6466,
  "aliases": ["RCKiK Gdańsk", "RCKIK GDA"],
  "active": true
}
```

**Request Validation:**
- `name`: Required, max 255 chars
- `code`: Required, unique, max 50 chars
- `city`: Required, max 100 chars
- `address`: Optional, max 1000 chars
- `latitude`: Optional, numeric(9,6)
- `longitude`: Optional, numeric(9,6)
- `aliases`: Optional, array of strings
- `active`: Optional, default true

**Success Response (201 Created):**
```json
{
  "id": 53,
  "name": "RCKiK Gdańsk",
  "code": "RCKIK-GDA",
  "city": "Gdańsk",
  "active": true,
  "createdAt": "2025-01-08T18:00:00Z"
}
```

**Business Logic:**
1. Validate unique code
2. Create audit log entry (RCKIK_CREATED)

---

#### Admin - Update RCKiK Center
**US-019: Edit Center**

- **Method:** PUT
- **Path:** `/api/v1/admin/rckik/{id}`
- **Description:** Update blood center information
- **Authentication:** Required (JWT, role=ADMIN)
- **Path Parameters:**
  - `id`: RCKiK ID

**Request Body:** Same as create (all fields)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "RCKiK Warszawa - Updated",
  "code": "RCKIK-WAW",
  "updatedAt": "2025-01-08T18:15:00Z"
}
```

**Business Logic:**
1. Create audit log entry (RCKIK_UPDATED)
2. Update associated snapshots if code/name changed

---

#### Admin - Delete RCKiK Center
- **Method:** DELETE
- **Path:** `/api/v1/admin/rckik/{id}`
- **Description:** Deactivate or delete blood center
- **Authentication:** Required (JWT, role=ADMIN)

**Success Response (204 No Content)**

**Business Logic:**
1. Soft delete or set active=false (business decision)
2. Cannot delete if has associated blood_snapshots (referential integrity)
3. Create audit log entry

---

#### Admin - Trigger Manual Scraping
**US-017: Manual Scraping**

- **Method:** POST
- **Path:** `/api/v1/admin/scraper/runs`
- **Description:** Manually trigger scraping for specific RCKiK or all
- **Authentication:** Required (JWT, role=ADMIN)

**Request Body:**
```json
{
  "rckikId": 1,
  "url": "https://rckik.warszawa.pl/stany-krwi"
}
```

**Request Validation:**
- `rckikId`: Optional, if provided must exist
- `url`: Optional, used for manual override

**Success Response (202 Accepted):**
```json
{
  "scraperId": 1001,
  "runType": "MANUAL",
  "status": "RUNNING",
  "triggeredBy": "admin@mkrew.pl",
  "startedAt": "2025-01-08T18:30:00Z",
  "statusUrl": "/api/v1/admin/scraper/runs/1001"
}
```

**Business Logic:**
1. Create scraper_run with run_type=MANUAL
2. Set triggered_by=admin_email
3. Queue scraping job (async)
4. Return immediately with run ID for status polling

---

#### Admin - List Scraper Runs
**US-018: Monitor Scraping**

- **Method:** GET
- **Path:** `/api/v1/admin/scraper/runs`
- **Description:** Get list of scraper execution runs
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:**
  - `status` (optional): Filter by status
  - `runType` (optional): Filter by type (SCHEDULED, MANUAL)
  - `fromDate` (optional): Filter from date
  - `page` (optional, default: 0)
  - `size` (optional, default: 20)

**Success Response (200 OK):**
```json
{
  "runs": [
    {
      "id": 1001,
      "runType": "SCHEDULED",
      "startedAt": "2025-01-08T02:00:00Z",
      "completedAt": "2025-01-08T02:15:30Z",
      "totalRckiks": 52,
      "successfulCount": 50,
      "failedCount": 2,
      "durationSeconds": 930,
      "triggeredBy": "SYSTEM",
      "status": "COMPLETED",
      "errorSummary": "2 centers failed due to timeout"
    }
  ],
  "page": 0,
  "totalElements": 245
}
```

---

#### Admin - Get Scraper Run Details
- **Method:** GET
- **Path:** `/api/v1/admin/scraper/runs/{id}`
- **Description:** Get detailed information about specific scraper run
- **Authentication:** Required (JWT, role=ADMIN)

**Success Response (200 OK):**
```json
{
  "id": 1001,
  "runType": "SCHEDULED",
  "startedAt": "2025-01-08T02:00:00Z",
  "completedAt": "2025-01-08T02:15:30Z",
  "totalRckiks": 52,
  "successfulCount": 50,
  "failedCount": 2,
  "durationSeconds": 930,
  "status": "COMPLETED",
  "logs": [
    {
      "id": 10001,
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "url": "https://rckik.warszawa.pl/stany-krwi",
      "status": "SUCCESS",
      "responseTimeMs": 1200,
      "httpStatusCode": 200,
      "recordsParsed": 8,
      "recordsFailed": 0
    },
    {
      "id": 10002,
      "rckikId": 2,
      "rckikName": "RCKiK Kraków",
      "url": "https://rckik.krakow.pl/krew",
      "status": "FAILED",
      "errorMessage": "Connection timeout after 30 seconds",
      "responseTimeMs": 30000,
      "httpStatusCode": null,
      "recordsParsed": 0,
      "recordsFailed": 8
    }
  ]
}
```

---

#### Admin - List Scraper Logs
**US-018: Export Logs**

- **Method:** GET
- **Path:** `/api/v1/admin/scraper/logs`
- **Description:** Query scraper logs across all runs
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:**
  - `runId` (optional): Filter by scraper run
  - `rckikId` (optional): Filter by RCKiK
  - `status` (optional): Filter by status (SUCCESS, PARTIAL, FAILED)
  - `fromDate` (optional)
  - `toDate` (optional)
  - `page` (optional, default: 0)
  - `size` (optional, default: 50)

**Success Response (200 OK):**
```json
{
  "logs": [
    {
      "id": 10001,
      "scraperRunId": 1001,
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "url": "https://rckik.warszawa.pl/stany-krwi",
      "status": "SUCCESS",
      "parserVersion": "1.2.0",
      "responseTimeMs": 1200,
      "httpStatusCode": 200,
      "recordsParsed": 8,
      "recordsFailed": 0,
      "createdAt": "2025-01-08T02:05:00Z"
    }
  ],
  "page": 0,
  "totalElements": 5200
}
```

---

#### Admin - List User Reports
**US-021: Manage Reports**

- **Method:** GET
- **Path:** `/api/v1/admin/reports`
- **Description:** Get user-submitted data quality reports
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:**
  - `status` (optional): Filter by status
  - `rckikId` (optional): Filter by RCKiK
  - `page` (optional, default: 0)
  - `size` (optional, default: 20)

**Success Response (200 OK):**
```json
{
  "reports": [
    {
      "id": 701,
      "user": {
        "id": 123,
        "email": "user@example.com"
      },
      "rckikId": 1,
      "bloodSnapshotId": 1001,
      "description": "The blood level for A+ seems incorrect...",
      "screenshotUrl": "https://storage.googleapis.com/...",
      "status": "NEW",
      "adminNotes": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2025-01-08T17:00:00Z"
    }
  ],
  "page": 0,
  "totalElements": 45
}
```

---

#### Admin - Update Report Status
- **Method:** PATCH
- **Path:** `/api/v1/admin/reports/{id}`
- **Description:** Update report status and add admin notes
- **Authentication:** Required (JWT, role=ADMIN)

**Request Body:**
```json
{
  "status": "RESOLVED",
  "adminNotes": "Verified with RCKiK. Data was correct, updated scraper to better handle edge cases."
}
```

**Request Validation:**
- `status`: Optional, one of: "NEW", "IN_REVIEW", "RESOLVED", "REJECTED"
- `adminNotes`: Optional, max 2000 chars

**Success Response (200 OK):**
```json
{
  "id": 701,
  "status": "RESOLVED",
  "adminNotes": "Verified with RCKiK...",
  "resolvedBy": "admin@mkrew.pl",
  "resolvedAt": "2025-01-08T19:00:00Z"
}
```

**Business Logic:**
1. Set resolvedBy to current admin user
2. Set resolvedAt if status changes to RESOLVED/REJECTED
3. Create audit log entry

---

#### Admin - Email Deliverability Metrics
**US-022: Email Analytics**

- **Method:** GET
- **Path:** `/api/v1/admin/email-logs/metrics`
- **Description:** Get email deliverability statistics
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:**
  - `fromDate` (required): Start date
  - `toDate` (required): End date
  - `notificationType` (optional): Filter by type
  - `rckikId` (optional): Filter by RCKiK

**Success Response (200 OK):**
```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-08"
  },
  "metrics": {
    "totalSent": 1250,
    "totalDelivered": 1200,
    "totalBounced": 15,
    "totalOpened": 480,
    "deliveryRate": 96.0,
    "bounceRate": 1.2,
    "openRate": 40.0,
    "hardBounceCount": 8,
    "softBounceCount": 7
  },
  "byType": [
    {
      "notificationType": "CRITICAL_ALERT",
      "totalSent": 450,
      "deliveryRate": 98.0,
      "openRate": 65.0
    },
    {
      "notificationType": "DAILY_SUMMARY",
      "totalSent": 600,
      "deliveryRate": 95.0,
      "openRate": 28.0
    }
  ]
}
```

**Business Logic:**
1. Aggregate from email_logs table
2. Calculate rates: deliveryRate = (delivered/sent)*100
3. Group by notification_type if requested

---

#### Admin - List Audit Logs
**US-024: Audit Trail**

- **Method:** GET
- **Path:** `/api/v1/admin/audit-logs`
- **Description:** Get immutable audit log entries for critical operations
- **Authentication:** Required (JWT, role=ADMIN)
- **Query Parameters:**
  - `actorId` (optional): Filter by actor
  - `action` (optional): Filter by action type
  - `targetType` (optional): Filter by target type
  - `targetId` (optional): Filter by target ID
  - `fromDate` (optional)
  - `toDate` (optional)
  - `page` (optional, default: 0)
  - `size` (optional, default: 50)

**Success Response (200 OK):**
```json
{
  "auditLogs": [
    {
      "id": 9001,
      "actorId": "admin@mkrew.pl",
      "action": "RCKIK_UPDATED",
      "targetType": "rckik",
      "targetId": 1,
      "metadata": {
        "changes": {
          "name": {
            "old": "RCKiK Warszawa",
            "new": "RCKiK Warszawa - Updated"
          }
        }
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-08T18:15:00Z"
    },
    {
      "id": 9000,
      "actorId": "123",
      "action": "DONATION_DELETED",
      "targetType": "donation",
      "targetId": 500,
      "metadata": {
        "donationDate": "2025-01-01",
        "rckikId": 1,
        "quantityMl": 450
      },
      "ipAddress": "203.0.113.50",
      "createdAt": "2025-01-08T16:00:00Z"
    }
  ],
  "page": 0,
  "totalElements": 8945
}
```

**Business Logic:**
1. Read-only endpoint (audit_logs is immutable via triggers)
2. Sensitive data - admin access only
3. Support export for compliance

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**JWT (JSON Web Token) Based Authentication**

- **Token Type:** Bearer token
- **Token Location:** HTTP Authorization header: `Authorization: Bearer <token>`
- **Token Lifetime:**
  - Access Token: 1 hour (3600 seconds)
  - Refresh Token: 7 days (optional, for token refresh endpoint)
- **Token Claims:**
  ```json
  {
    "sub": "123",
    "email": "user@example.com",
    "role": "USER",
    "iat": 1704715200,
    "exp": 1704718800
  }
  ```

**Token Generation:**
- Issued on successful login (`POST /api/v1/auth/login`)
- Signed using HS256 or RS256 algorithm
- Secret key stored in environment variables (GCP Secret Manager)

**Token Validation:**
- Every protected endpoint validates JWT signature
- Check token not expired
- Extract user_id and role from claims
- Optionally verify session in `user_sessions` table (if tracking sessions)

**Token Refresh (Optional for MVP):**
- **Method:** POST
- **Path:** `/api/v1/auth/refresh`
- **Description:** Get new access token using refresh token
- Refresh tokens stored in `user_tokens` table with type=REFRESH_TOKEN

### 3.2 Authorization Model

**Roles:**
1. **USER** (default): Regular blood donor
2. **ADMIN**: System administrator

**Authorization Rules:**

| Endpoint Pattern | USER | ADMIN | Public |
|-----------------|------|-------|--------|
| `/api/v1/auth/register` | ✓ | ✓ | ✓ |
| `/api/v1/auth/login` | ✓ | ✓ | ✓ |
| `/api/v1/auth/verify-email` | ✓ | ✓ | ✓ |
| `/api/v1/auth/password-reset/*` | ✓ | ✓ | ✓ |
| `/api/v1/users/me` | ✓ (self) | ✓ | ✗ |
| `/api/v1/users/me/*` | ✓ (self) | ✓ | ✗ |
| `/api/v1/rckik` (GET) | ✓ | ✓ | ✓ |
| `/api/v1/rckik/{id}` (GET) | ✓ | ✓ | ✓ |
| `/api/v1/rckik/{id}/blood-levels` (GET) | ✓ | ✓ | ✓ |
| `/api/v1/blood-levels/latest` (GET) | ✓ | ✓ | ✓ |
| `/api/v1/donations/confirm` (GET) | ✓ | ✓ | ✓ |
| `/api/v1/reports` (POST) | ✓ | ✓ | ✗ |
| `/api/v1/admin/*` | ✗ | ✓ | ✗ |

**Resource-Level Authorization:**
- Users can only access their own resources (donations, notifications, favorites)
- Enforced by filtering queries with `user_id = JWT.sub`
- Admin can access all resources

**Implementation (Spring Security):**
```java
@PreAuthorize("hasRole('USER')")
public ResponseEntity<List<Donation>> getUserDonations() {
    Long userId = SecurityContextHolder.getContext().getUserId();
    // Filter by userId
}

@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<ScraperRun>> getScraperRuns() {
    // Admin-only access
}
```

### 3.3 Security Measures

**Rate Limiting:**
- **Implementation:** Bucket4j (token bucket algorithm) or Spring Security rate limiter
- **Limits:**
  - Registration: 5 requests per IP per hour
  - Login: 5 failed attempts per email → 5-minute lockout
  - Password reset: 3 requests per email per hour
  - API endpoints (authenticated): 100 requests per user per minute
  - API endpoints (public): 20 requests per IP per minute

**CAPTCHA:**
- Trigger CAPTCHA after 3 failed login attempts
- Use Google reCAPTCHA v3 or hCaptcha
- Validate CAPTCHA token server-side

**CORS (Cross-Origin Resource Sharing):**
- Allow requests from frontend domain(s) only
- Whitelist origins: `https://mkrew.pl`, `https://www.mkrew.pl`
- Dev: Allow `http://localhost:3000` for frontend development

**CSRF Protection:**
- For cookie-based auth: Enable CSRF tokens
- For JWT bearer tokens: CSRF protection not required (stateless)

**TLS/SSL:**
- All API requests must use HTTPS in production
- HTTP Strict Transport Security (HSTS) header enabled
- TLS 1.2+ required

**Input Sanitization:**
- Validate and sanitize all user input
- Prevent SQL injection (use parameterized queries with JPA)
- Prevent XSS (escape output, Content-Security-Policy headers)

**Password Security:**
- Hash passwords with Argon2id or BCrypt (cost factor 12)
- Never log or expose password hashes
- Enforce password requirements: min 8 chars, complexity rules

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Users (`/api/v1/users`, `/api/v1/auth/register`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `email` | string | UNIQUE, NOT NULL | Valid email format (RFC 5322), max 255 chars, case-insensitive |
| `password` | string | NOT NULL | Min 8 chars, must contain: uppercase, lowercase, digit, special char |
| `firstName` | string | NOT NULL | Max 100 chars, no special chars except hyphens/apostrophes |
| `lastName` | string | NOT NULL | Max 100 chars, no special chars except hyphens/apostrophes |
| `bloodGroup` | string | NULLABLE | Must be one of: "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-" or null |
| `consentAccepted` | boolean | NOT NULL | Must be true for registration |
| `consentVersion` | string | NOT NULL | Must match current policy version (e.g., "1.0") |

**Business Logic:**
- On registration: `email_verified=false`, must verify via email
- Password hashed with Argon2 before storage, never stored plaintext
- `deleted_at IS NULL` to filter active users
- Cannot change email without verification flow (not in MVP)

---

#### RCKiK (`/api/v1/admin/rckik`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `name` | string | NOT NULL | Max 255 chars |
| `code` | string | UNIQUE, NOT NULL | Max 50 chars, uppercase alphanumeric with hyphens |
| `city` | string | NOT NULL | Max 100 chars |
| `address` | string | NULLABLE | Max 1000 chars |
| `latitude` | decimal | NULLABLE | NUMERIC(9,6), range: -90 to 90 |
| `longitude` | decimal | NULLABLE | NUMERIC(9,6), range: -180 to 180 |
| `aliases` | array | NULLABLE | Array of strings, each max 255 chars |
| `active` | boolean | NOT NULL | Default true |

**Business Logic:**
- `code` must be unique across all centers
- `aliases` used for fuzzy matching during scraping
- Cannot hard delete if has associated blood_snapshots (referential integrity)
- Deactivate instead: set `active=false`

---

#### Blood Snapshots (`/api/v1/rckik/{id}/blood-levels`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `rckikId` | bigint | FK, NOT NULL | Must exist in `rckik` table |
| `snapshotDate` | date | NOT NULL | ISO 8601 date format, cannot be future date |
| `bloodGroup` | string | NOT NULL | Must be one of 8 valid blood groups |
| `levelPercentage` | decimal | NOT NULL | NUMERIC(5,2), CHECK: 0.00 to 100.00 |
| `sourceUrl` | string | NULLABLE | Valid URL format |
| `parserVersion` | string | NULLABLE | Max 50 chars, semantic version format (e.g., "1.2.0") |
| `isManual` | boolean | NOT NULL | Default false, true for admin-created |

**Business Logic:**
- Computed field: `levelStatus` = "CRITICAL" if <20%, "IMPORTANT" if <50%, "OK" if >=50%
- Multiple snapshots per day allowed (for corrections)
- `scraped_at` timestamp tracks when data was collected
- Admin-created snapshots: `is_manual=true`

---

#### Donations (`/api/v1/users/me/donations`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `userId` | bigint | FK, NOT NULL | Must exist, auto-set from JWT |
| `rckikId` | bigint | FK, NOT NULL | Must exist in `rckik` table |
| `donationDate` | date | NOT NULL | ISO 8601 date, cannot be future date, not older than 5 years |
| `quantityMl` | integer | NOT NULL | CHECK: 50 to 1000 (configurable per donation type) |
| `donationType` | string | NOT NULL | Must be one of: "FULL_BLOOD", "PLASMA", "PLATELETS", "OTHER" |
| `notes` | string | NULLABLE | Max 1000 chars |
| `confirmed` | boolean | NOT NULL | Default false, set true via confirmation email |

**Business Logic:**
- User can only access own donations (filter by `user_id = JWT.sub`)
- Soft delete: `deleted_at IS NULL` to filter active donations
- Edit/delete requires ownership verification
- Deletion creates audit log entry (DONATION_DELETED)
- Export excludes deleted donations
- Validation: Minimum 56 days between full blood donations (optional warning, not enforced)

---

#### Notification Preferences (`/api/v1/users/me/notification-preferences`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `userId` | bigint | FK, UNIQUE, NOT NULL | One-to-one with user |
| `emailEnabled` | boolean | NOT NULL | Default true |
| `emailFrequency` | string | NOT NULL | Must be: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE" |
| `inAppEnabled` | boolean | NOT NULL | Default true |
| `inAppFrequency` | string | NOT NULL | Must be: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE" |

**Business Logic:**
- Auto-create with defaults on user registration
- If `emailEnabled=false`, no emails sent regardless of frequency
- Frequency options:
  - DISABLED: No notifications
  - ONLY_CRITICAL: Blood level <20%
  - DAILY: Daily digest at configured time
  - IMMEDIATE: Real-time notifications

---

#### In-App Notifications (`/api/v1/users/me/notifications`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `userId` | bigint | FK, NOT NULL | Must exist |
| `notificationType` | string | NOT NULL | Must be: "CRITICAL_BLOOD_LEVEL", "SYSTEM_ALERT", "DONATION_REMINDER", "OTHER" |
| `rckikId` | bigint | FK, NULLABLE | Optional link to RCKiK |
| `title` | string | NOT NULL | Max 255 chars |
| `message` | string | NOT NULL | Max 2000 chars |
| `linkUrl` | string | NULLABLE | Relative or absolute URL |
| `readAt` | timestamp | NULLABLE | Set when user marks as read |
| `expiresAt` | timestamp | NULLABLE | Optional expiration |

**Business Logic:**
- Filter by `user_id = JWT.sub`
- Unread filter: `read_at IS NULL`
- Optional: Auto-expire old read notifications (>30 days)
- Marking as read: Set `readAt=NOW()`

---

#### User Reports (`/api/v1/reports`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `userId` | bigint | FK, NOT NULL | Auto-set from JWT |
| `rckikId` | bigint | FK, NOT NULL | Must exist |
| `bloodSnapshotId` | bigint | FK, NULLABLE | Optional reference to specific snapshot |
| `description` | string | NOT NULL | Max 2000 chars |
| `screenshotUrl` | string | NULLABLE | Valid HTTPS URL (Cloud Storage) |
| `status` | string | NOT NULL | Must be: "NEW", "IN_REVIEW", "RESOLVED", "REJECTED" |

**Business Logic:**
- Users can create reports (authenticated)
- Only admins can update status and add notes
- Status flow: NEW → IN_REVIEW → RESOLVED/REJECTED
- Upload screenshot to Cloud Storage, store public URL

---

#### User Tokens (`/api/v1/auth/*`, `/api/v1/donations/confirm`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `userId` | bigint | FK, NOT NULL | Must exist |
| `token` | string | UNIQUE, NOT NULL | Cryptographically secure random token (hashed in DB) |
| `tokenType` | string | NOT NULL | Must be: "EMAIL_VERIFICATION", "PASSWORD_RESET", "DONATION_CONFIRMATION" |
| `expiresAt` | timestamp | NOT NULL | Must be future timestamp |
| `usedAt` | timestamp | NULLABLE | Null until used |

**Business Logic:**
- Token generation: Use `SecureRandom`, hash with SHA-256 before storage
- Token validation: Check `expires_at > NOW()` and `used_at IS NULL`
- One-time use: Set `usedAt=NOW()` after consumption
- TTL by type:
  - EMAIL_VERIFICATION: 24 hours
  - PASSWORD_RESET: 1 hour
  - DONATION_CONFIRMATION: Single-use, no strict expiry
- Clean up expired tokens periodically (scheduled job)

---

#### Scraper Runs (`/api/v1/admin/scraper/*`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `runType` | string | NOT NULL | Must be: "SCHEDULED", "MANUAL" |
| `status` | string | NOT NULL | Must be: "RUNNING", "COMPLETED", "FAILED", "PARTIAL" |
| `triggeredBy` | string | NOT NULL | "SYSTEM" or admin email |

**Business Logic:**
- SCHEDULED runs: Triggered by cron job (daily 02:00 CET)
- MANUAL runs: Triggered by admin via API
- Status flow: RUNNING → COMPLETED/FAILED/PARTIAL
- PARTIAL: Some RCKiK succeeded, some failed
- Update `completed_at` and `duration_seconds` on completion

---

#### Audit Logs (`/api/v1/admin/audit-logs`)

| Field | Type | Constraints | Validation |
|-------|------|-------------|------------|
| `actorId` | string | NOT NULL | User ID or "SYSTEM" |
| `action` | string | NOT NULL | Action type (e.g., "ACCOUNT_DELETED", "RCKIK_UPDATED") |
| `targetType` | string | NOT NULL | Entity type (e.g., "user", "rckik", "donation") |
| `targetId` | bigint | NULLABLE | Entity ID if applicable |
| `metadata` | jsonb | NULLABLE | Additional context (before/after values, etc.) |

**Business Logic:**
- **Immutable:** Triggers prevent UPDATE and DELETE operations
- Auto-created for critical operations:
  - User account deletion
  - Donation deletion
  - RCKiK creation/update/deletion
  - Admin actions on reports
- `actorId`: User ID for user actions, "SYSTEM" for automated actions
- `metadata` stores change details (old vs new values)
- Required for GDPR compliance and security audits

---

### 4.2 Error Response Format

**Standard Error Response:**
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "path": "/api/v1/users/me/donations",
  "details": [
    {
      "field": "quantityMl",
      "message": "Quantity must be between 50 and 1000 ml",
      "rejectedValue": 1500
    }
  ]
}
```

**Common Error Codes:**
- `400 BAD_REQUEST`: Validation errors, malformed request
- `401 UNAUTHORIZED`: Missing or invalid authentication
- `403 FORBIDDEN`: Insufficient permissions
- `404 NOT_FOUND`: Resource not found
- `409 CONFLICT`: Duplicate resource (e.g., email already registered)
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded
- `500 INTERNAL_SERVER_ERROR`: Server error
- `503 SERVICE_UNAVAILABLE`: Service temporarily unavailable

---

### 4.3 Pagination and Filtering

**Pagination Parameters (Query Params):**
- `page` (default: 0): Zero-based page number
- `size` (default: 20, max: 100): Number of items per page
- `sortBy` (optional): Field name to sort by
- `sortOrder` (optional, default: "ASC"): "ASC" or "DESC"

**Pagination Response Format:**
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 245,
  "totalPages": 13,
  "first": true,
  "last": false
}
```

**Filtering:**
- Resource-specific query parameters (e.g., `city`, `bloodGroup`, `status`)
- Date range filters: `fromDate`, `toDate` (ISO 8601 format)
- Boolean filters: `active`, `unreadOnly`

---

### 4.4 Async Operations

**Endpoints with Async Support:**
1. **Donation Export** (`GET /api/v1/users/me/donations/export`)
   - MVP: Synchronous for small datasets
   - Future: Async with job ID and download link

2. **Manual Scraping** (`POST /api/v1/admin/scraper/runs`)
   - Returns immediately with run ID
   - Client polls status: `GET /api/v1/admin/scraper/runs/{id}`

**Async Pattern:**
```json
// Initial request
POST /api/v1/admin/scraper/runs
Response 202 Accepted:
{
  "jobId": 1001,
  "status": "RUNNING",
  "statusUrl": "/api/v1/admin/scraper/runs/1001"
}

// Poll status
GET /api/v1/admin/scraper/runs/1001
Response 200 OK:
{
  "jobId": 1001,
  "status": "COMPLETED",
  "startedAt": "2025-01-08T18:30:00Z",
  "completedAt": "2025-01-08T18:45:30Z"
}
```

---

### 4.5 Caching Strategy

**Cacheable Endpoints:**
- `GET /api/v1/rckik`: Cache 5 minutes (public data)
- `GET /api/v1/rckik/{id}`: Cache 5 minutes
- `GET /api/v1/blood-levels/latest`: Cache 1 minute (uses materialized view)

**Cache Headers:**
```http
Cache-Control: public, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**Cache Invalidation:**
- After scraping: Refresh materialized view, invalidate blood level caches
- After RCKiK update: Invalidate RCKiK caches
- Use Redis or Spring Cache for application-level caching

---

## 5. Versioning and Deprecation

**API Versioning:**
- Base URL includes version: `/api/v1`
- Breaking changes require new major version: `/api/v2`
- Maintain backward compatibility within major version

**Deprecation Process:**
1. Add deprecation notice in response headers:
   ```http
   Deprecation: Sat, 1 Jun 2025 00:00:00 GMT
   Sunset: Sat, 1 Sep 2025 00:00:00 GMT
   Link: <https://docs.mkrew.pl/api/migration-guide-v2>; rel="deprecation"
   ```
2. Document in API changelog
3. Provide migration guide
4. Minimum 3 months notice before sunset

---

## 6. Future Enhancements (Post-MVP)

### 6.1 Planned Endpoints

1. **WebSocket/SSE for Real-Time Notifications**
   - `WS /api/v1/ws/notifications`
   - Push notifications to connected clients

2. **Advanced Analytics**
   - `GET /api/v1/analytics/blood-trends`
   - `GET /api/v1/analytics/donation-heatmap`

3. **Geolocation**
   - `GET /api/v1/rckik/nearby?lat={lat}&lon={lon}&radius={km}`
   - Find nearest RCKiK centers

4. **Predictive Alerts**
   - `GET /api/v1/predictions/blood-demand`
   - ML-based demand forecasting (future iteration)

5. **Public API for RCKiK Centers**
   - Official API for RCKiK to submit data directly
   - Alternative to web scraping

6. **Mobile Push Notifications**
   - Firebase Cloud Messaging integration
   - `POST /api/v1/users/me/push-tokens` to register device

---

## 7. OpenAPI Specification

**API Documentation:**
- Generate OpenAPI 3.0 specification using SpringDoc
- Interactive documentation: Swagger UI at `/swagger-ui.html`
- Redoc at `/redoc`
- OpenAPI JSON: `/v3/api-docs`

**Example OpenAPI snippet:**
```yaml
openapi: 3.0.3
info:
  title: mkrew Blood Donation Platform API
  version: 1.0.0
  description: REST API for blood donation tracking and notification system
  contact:
    email: api@mkrew.pl
servers:
  - url: https://api.mkrew.pl/api/v1
    description: Production
  - url: https://staging-api.mkrew.pl/api/v1
    description: Staging
```

---

## 8. Success Criteria

**API Quality Metrics:**
- **Availability:** 99.5% uptime (MVP target)
- **Response Time:**
  - P50: <200ms
  - P95: <500ms
  - P99: <1000ms
- **Error Rate:** <1% of requests result in 5xx errors
- **Documentation:** 100% endpoint coverage in OpenAPI spec

**Security Compliance:**
- Pass OWASP Top 10 security audit
- Rate limiting prevents abuse
- All sensitive data encrypted in transit (TLS) and at rest

**Alignment with PRD:**
- ✅ All 27 User Stories mapped to API endpoints
- ✅ Authentication (US-001 to US-004)
- ✅ Profile management (US-005, US-006)
- ✅ RCKiK browsing (US-007, US-008, US-009)
- ✅ Notifications (US-010, US-011)
- ✅ Donation diary (US-012, US-013, US-014, US-027)
- ✅ GDPR compliance (US-015, US-016)
- ✅ Admin operations (US-017, US-018, US-019, US-021, US-022, US-024)
- ✅ Security (US-023)

---

**Document Status:** Ready for Implementation
**Next Steps:**
1. Review and approval by stakeholders
2. Generate OpenAPI specification from this plan
3. Begin Spring Boot implementation
4. Set up API testing suite (Postman/REST Assured)
5. Configure CI/CD pipeline for API deployment
