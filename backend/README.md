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
│   └── UserFavoriteRckikRepository.java
├── service/              # Business logic
│   └── AuthService.java
├── controller/           # REST controllers
│   └── AuthController.java
├── dto/                  # Data Transfer Objects
│   ├── RegisterRequest.java
│   ├── RegisterResponse.java
│   └── ErrorResponse.java
├── exception/            # Exception handling
│   ├── GlobalExceptionHandler.java
│   ├── EmailAlreadyExistsException.java
│   └── ResourceNotFoundException.java
├── config/               # Configuration
│   └── SecurityConfig.java
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
12. ⏳ Email service integration (SendGrid/Mailgun)
13. ⏳ Profile management endpoints (US-005)
14. ⏳ Notification preferences (US-006)
15. ⏳ Add integration tests

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
