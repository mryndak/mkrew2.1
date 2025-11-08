# mkrew Backend - Spring Boot Application

## Overview
Backend application for the mkrew blood donation platform built with Java 21 and Spring Boot 3.2.

## Tech Stack
- **Java 21**
- **Spring Boot 3.2.1**
  - Spring Web (REST API)
  - Spring Data JPA
  - Spring Security (Authentication & Authorization)
  - Spring Validation
  - Spring Actuator
- **PostgreSQL 16**
- **Liquibase** (database migrations)
- **BCrypt** (password hashing, cost factor 12)
- **JWT** (JSON Web Tokens for authentication)
- **SpringDoc OpenAPI 3.0** (Swagger UI for API documentation)
- **Lombok** (code generation)
- **Gradle 8.5** (build tool)

## Project Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/pl/mkrew/backend/
│   │   │   ├── entity/          # JPA entities (15 entities)
│   │   │   └── MkrewBackendApplication.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
├── build.gradle
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## JPA Entities

All 15 entities implemented matching the database schema:

### Core Entities
1. **User** - User accounts and profiles
2. **Rckik** - Blood donation centers (canonical list)
3. **BloodSnapshot** - Blood inventory snapshots
4. **UserFavoriteRckik** - User's favorite centers (Many-to-Many)
5. **Donation** - User donation diary

### Notification Entities
6. **NotificationPreference** - User notification settings
7. **InAppNotification** - In-app notifications

### Communication
8. **EmailLog** - Email delivery tracking

### Authentication
9. **UserToken** - Verification and reset tokens
10. **UserSession** - User sessions (optional)

### Web Scraping
11. **ScraperRun** - Scraping execution runs
12. **ScraperLog** - Individual scraping logs
13. **ScraperConfig** - Scraper configurations

### Admin
14. **UserReport** - User-submitted data issues
15. **AuditLog** - Immutable audit trail

## Prerequisites

- **Java 21** (JDK)
- **Docker** and **Docker Compose**
- **Gradle 8.5+** (or use included Gradle Wrapper)

## Getting Started

### 1. Local Development (without Docker)

#### Prerequisites
- PostgreSQL 16 running locally on port 5432
- Database `mkrew` created with user `mkrew_user`

#### Run Liquibase migrations
```bash
cd ../db
docker-compose up liquibase
```

#### Start application
```bash
./gradlew bootRun
```

Application will start on `http://localhost:8080`

### 2. Docker Compose (Recommended)

Start all services (PostgreSQL + Liquibase + Backend):

```bash
docker-compose up -d
```

This will:
1. Start PostgreSQL on port 5433
2. Run Liquibase migrations
3. Build and start Spring Boot application on port 8080

Check logs:
```bash
docker-compose logs -f backend
```

Stop services:
```bash
docker-compose down
```

### 3. Build JAR manually

```bash
./gradlew clean build
```

JAR will be created in `build/libs/mkrew-backend-0.0.1-SNAPSHOT.jar`

Run JAR:
```bash
java -jar build/libs/mkrew-backend-0.0.1-SNAPSHOT.jar
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | mkrew | Database name |
| `DB_USER` | mkrew_user | Database user |
| `DB_PASSWORD` | mkrew_password | Database password |
| `PORT` | 8080 | Application port |
| `JWT_SECRET` | (auto-generated) | JWT signing secret (min 256 bits) |
| `SPRING_PROFILES_ACTIVE` | dev | Spring profile |

### Database Configuration

See `src/main/resources/application.yml` for full configuration.

## Endpoints

### Swagger UI (API Documentation)

Interactive API documentation with Swagger UI:

```
http://localhost:8080/swagger-ui.html
```

**Features:**
- Browse all API endpoints
- Test endpoints directly from browser
- View request/response schemas
- Authenticate with JWT tokens
- See validation rules and examples

**OpenAPI Specification:**
```
http://localhost:8080/v3/api-docs
```

**Documentation:** See `docs/SWAGGER.md` for detailed usage guide

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

Response:
```json
{
  "status": "UP"
}
```

### Actuator Endpoints
- `/actuator/health` - Health status
- `/actuator/info` - Application info
- `/actuator/metrics` - Application metrics

## Testing

Run all tests:
```bash
./gradlew test
```

## Database Schema

Database schema is managed by Liquibase. Migration files are located in `../db/changelog/changesets/`

**17 Changesets:**
- 001-015: Table creation (15 business tables)
- 016: Additional indexes
- 017: Materialized view (mv_latest_blood_levels)

## Development Notes

### JPA Entity Mappings

All entities use:
- `@Entity` - JPA entity annotation
- `@Table` - Explicit table name mapping
- `@Getter/@Setter` - Lombok getters/setters
- `@NoArgsConstructor/@AllArgsConstructor/@Builder` - Lombok constructors
- `@CreationTimestamp/@UpdateTimestamp` - Automatic timestamps

Foreign keys are explicitly named:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false,
    foreignKey = @ForeignKey(name = "fk_donations_user"))
private User user;
```

### Lazy Loading
All `@ManyToOne` and `@OneToOne` relationships use `FetchType.LAZY` for performance.

### JSON/JSONB Support
JSONB columns use Hibernate's `@JdbcTypeCode`:
```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(columnDefinition = "JSONB")
private String metadata;
```

### Array Support
PostgreSQL arrays use Hibernate's array support:
```java
@JdbcTypeCode(SqlTypes.ARRAY)
@Column(columnDefinition = "TEXT[]")
private String[] aliases;
```

## Implemented Features

### ✅ US-001: User Registration
- **Endpoint:** `POST /api/v1/auth/register`
- **Features:**
  - Email uniqueness validation
  - Password hashing with BCrypt (cost factor 12)
  - User creation with email_verified=false
  - Verification token generation (24h TTL)
  - Favorite RCKiK centers association
  - GDPR consent recording
- **Documentation:** See `docs/API-REGISTRATION.md`

### ✅ US-002: Email Verification
- **Endpoint:** `GET /api/v1/auth/verify-email?token={token}`
- **Features:**
  - Token validation (exists, not expired, not used)
  - 24-hour token expiration
  - Idempotent operation
  - Marks user as verified
  - One-time token usage
- **Documentation:** See `docs/API-EMAIL-VERIFICATION.md`

### ✅ US-003: User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Features:**
  - JWT authentication (access + refresh tokens)
  - Email verification check
  - Rate limiting (5 attempts per 5 minutes)
  - Account lockout on failed attempts
  - BCrypt password verification
- **Documentation:** See `docs/API-LOGIN.md`

### ✅ US-004: Password Reset
- **Endpoints:**
  - `POST /api/v1/auth/password-reset/request`
  - `POST /api/v1/auth/password-reset/confirm`
- **Features:**
  - Two-step reset process
  - Email enumeration prevention
  - 1-hour token expiration
  - Password complexity validation
  - Old token invalidation
- **Documentation:** See `docs/API-PASSWORD-RESET.md`

### ✅ US-005: User Profile Management
- **Endpoints:**
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`
- **Features:**
  - Get current user profile
  - Update profile fields (firstName, lastName, bloodGroup)
  - Partial update (only provided fields)
  - JWT authentication required
  - Email cannot be changed
  - Automatic timestamp update
- **Documentation:** See `docs/API-USER-PROFILE.md`

### ✅ US-006: Notification Preferences
- **Endpoints:**
  - `GET /api/v1/users/me/notification-preferences`
  - `PUT /api/v1/users/me/notification-preferences`
- **Features:**
  - Get notification preferences (auto-creates with defaults if not exists)
  - Update email and in-app notification preferences
  - Four frequency options: DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE
  - Opt-out capability (disable all notifications)
  - One-to-one relationship with users
  - JWT authentication required
  - Full update (PUT method - all fields required)
- **Documentation:** See `docs/API-NOTIFICATION-PREFERENCES.md`

### ✅ US-007: Browse Blood Centers
- **Endpoint:** `GET /api/v1/rckik`
- **Features:**
  - Public endpoint (no authentication required)
  - Paginated list of RCKiK blood donation centers
  - Current blood levels for all blood groups
  - Blood level status (CRITICAL <20%, IMPORTANT <50%, OK >=50%)
  - Filter by city and active status
  - Sorting by name, city, or code
  - Optimized batch fetching of blood levels
  - Read-only transaction for performance
- **Documentation:** See `docs/API-RCKIK-LIST.md`

### ✅ US-008: View Center Details and Trends
- **Endpoints:**
  - `GET /api/v1/rckik/{id}` - Get center details
  - `GET /api/v1/rckik/{id}/blood-levels` - Get blood level history
- **Features:**
  - Public endpoints (no authentication required)
  - Detailed center information with metadata
  - Current blood levels and scraping status
  - Historical blood level snapshots with pagination
  - Filter history by blood group and date range
  - Scraping status tracking (OK, DEGRADED, FAILED, UNKNOWN)
  - Support for trend analysis and charting
- **Documentation:** See `docs/API-RCKIK-DETAILS.md`

### ✅ US-009: Favorite Blood Centers Management
- **Endpoints:**
  - `GET /api/v1/users/me/favorites` - Get user's favorites
  - `POST /api/v1/users/me/favorites/{rckikId}` - Add to favorites
  - `DELETE /api/v1/users/me/favorites/{rckikId}` - Remove from favorites
- **Features:**
  - JWT authentication required
  - Add/remove centers from favorites
  - Optional priority ordering
  - List favorites with current blood levels
  - Duplicate prevention
  - Enables targeted notifications (US-010, US-011)
  - Batch fetching of blood levels for performance
- **Documentation:** See `docs/API-FAVORITE-RCKIK.md`

### ✅ US-010: Email Notifications for Critical Blood Levels
- **Type:** Background Service (Scheduled Job)
- **Features:**
  - Automated monitoring of blood inventory levels
  - Daily scheduled check at 03:00 CET (after scraping)
  - Email alerts via SendGrid integration
  - Critical threshold: Blood levels below 20%
  - User eligibility filtering:
    - Active accounts with verified emails
    - Users with notification preferences enabled
    - Email frequency: ONLY_CRITICAL or IMMEDIATE
    - RCKiK centers in user's favorites
  - Rate limiting: Max 5 emails per user per 24 hours
  - Personalized HTML email templates
  - Comprehensive email logging in `email_logs` table
  - Delivery, open, and bounce tracking
  - Manual trigger option for testing
- **Components:**
  - `EmailService` - SendGrid integration
  - `EmailLogService` - Email activity logging
  - `CriticalBloodLevelNotificationService` - Business logic
  - `NotificationScheduler` - Cron job scheduler
  - `EmailLogRepository` - Data access and analytics
- **Configuration:**
  - `SENDGRID_API_KEY` - SendGrid API key
  - `EMAIL_ENABLED` - Enable/disable email sending
  - `NOTIFICATION_CRITICAL_THRESHOLD` - Critical percentage (default: 20.0)
  - `NOTIFICATION_RATE_LIMIT` - Max emails per user per 24h (default: 5)
  - `SCHEDULER_NOTIFICATION_CHECK` - Cron schedule (default: 0 0 3 * * *)
- **Documentation:** See `docs/API-EMAIL-NOTIFICATIONS.md`

### ✅ Swagger API Documentation
- **Endpoint:** `http://localhost:8080/swagger-ui.html`
- **Features:**
  - Interactive API testing
  - JWT authentication support
  - Request/response schemas
  - Validation rules documentation
- **Documentation:** See `docs/SWAGGER.md`

## Project Structure

```
backend/src/main/java/pl/mkrew/backend/
├── entity/               # JPA entities (15 entities)
│   ├── User.java
│   ├── Rckik.java
│   ├── BloodSnapshot.java
│   ├── UserFavoriteRckik.java
│   ├── Donation.java
│   ├── NotificationPreference.java
│   ├── InAppNotification.java
│   ├── EmailLog.java
│   ├── UserToken.java
│   ├── UserSession.java
│   ├── ScraperRun.java
│   ├── ScraperLog.java
│   ├── ScraperConfig.java
│   ├── UserReport.java
│   └── AuditLog.java
├── repository/           # Spring Data JPA repositories
│   ├── UserRepository.java
│   ├── UserTokenRepository.java
│   ├── RckikRepository.java
│   ├── BloodSnapshotRepository.java
│   ├── ScraperLogRepository.java
│   ├── UserFavoriteRckikRepository.java
│   ├── NotificationPreferenceRepository.java
│   └── EmailLogRepository.java
├── service/              # Business logic
│   ├── AuthService.java
│   ├── UserService.java
│   ├── NotificationPreferenceService.java
│   ├── RckikService.java
│   ├── FavoriteRckikService.java
│   ├── EmailService.java
│   ├── EmailLogService.java
│   └── CriticalBloodLevelNotificationService.java
├── controller/           # REST controllers
│   ├── AuthController.java
│   ├── UserController.java
│   ├── NotificationPreferenceController.java
│   ├── RckikController.java
│   └── FavoriteRckikController.java
├── dto/                  # Data Transfer Objects
│   ├── RegisterRequest.java
│   ├── RegisterResponse.java
│   ├── UserProfileResponse.java
│   ├── UpdateProfileRequest.java
│   ├── NotificationPreferencesResponse.java
│   ├── UpdateNotificationPreferencesRequest.java
│   ├── RckikListResponse.java
│   ├── RckikSummaryDto.java
│   ├── RckikDetailDto.java
│   ├── BloodLevelDto.java
│   ├── BloodLevelHistoryDto.java
│   ├── BloodLevelHistoryResponse.java
│   ├── FavoriteRckikDto.java
│   ├── CriticalBloodLevelAlertDto.java
│   ├── EmailNotificationRequest.java
│   └── ErrorResponse.java
├── exception/            # Exception handling
│   ├── GlobalExceptionHandler.java
│   ├── EmailAlreadyExistsException.java
│   └── ResourceNotFoundException.java
├── config/               # Configuration
│   └── SecurityConfig.java
├── scheduler/            # Scheduled tasks
│   └── NotificationScheduler.java
└── MkrewBackendApplication.java
```

## Next Steps

1. ✅ Project structure created
2. ✅ All 15 JPA entities implemented
3. ✅ Docker Compose configuration
4. ✅ Implement repositories (Spring Data JPA)
5. ✅ Implement user registration (US-001)
6. ✅ Add Spring Security with BCrypt
7. ✅ Add validation and error handling
8. ✅ Implement email verification (US-002)
9. ✅ Implement login with JWT (US-003)
10. ✅ Implement password reset (US-004)
11. ✅ Add Swagger API documentation
12. ✅ Profile management endpoints (US-005)
13. ✅ JWT authentication filter for protected endpoints
14. ✅ Notification preferences (US-006)
15. ✅ Browse blood centers with blood levels (US-007)
16. ✅ RCKiK details view and blood level history (US-008)
17. ✅ Favorite RCKiK management (US-009)
18. ✅ Email service integration with SendGrid (US-010)
19. ✅ Critical blood level email notifications (US-010)
20. ⏳ In-app notifications (US-011)
21. ⏳ Donation diary management (US-012)
22. ⏳ Add integration tests

## Troubleshooting

### Port conflicts
If port 5433 or 8080 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Change PostgreSQL port
  # or
  - "8081:8080"  # Change backend port
```

### Liquibase fails
Check database connection and ensure migrations exist:
```bash
docker-compose logs liquibase
```

### Application fails to start
Check logs:
```bash
docker-compose logs backend
```

Verify PostgreSQL is healthy:
```bash
docker-compose ps
```

## License

Proprietary - mkrew Project
