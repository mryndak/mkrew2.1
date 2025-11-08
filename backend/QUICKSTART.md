# Quick Start Guide - mkrew Backend

## Prerequisites Setup

### 1. Download Gradle Wrapper JAR

The Gradle wrapper JAR is required but not included in the repository. Download it:

**Option A: Using wget/curl (Linux/Mac/Git Bash on Windows)**
```bash
cd backend
wget https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar -O gradle/wrapper/gradle-wrapper.jar
```

**Option B: Manual Download**
1. Download from: https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar
2. Save to: `backend/gradle/wrapper/gradle-wrapper.jar`

**Option C: Generate with installed Gradle**
If you have Gradle 8.5+ installed:
```bash
cd backend
gradle wrapper --gradle-version 8.5
```

## Starting the Application

### Method 1: Docker Compose (Recommended)

Start all services (PostgreSQL + Liquibase + Spring Boot):

```bash
cd backend
docker-compose up -d
```

This will:
1. Start PostgreSQL on port 5433
2. Run database migrations with Liquibase
3. Build and start Spring Boot application on port 8080

**Check if running:**
```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

**View logs:**
```bash
docker-compose logs -f backend
```

**Stop services:**
```bash
docker-compose down
```

### Method 2: Local Development

#### Prerequisites
- Java 21 JDK installed
- PostgreSQL 16 running locally
- Gradle wrapper JAR downloaded (see above)

#### 1. Setup Database

Start PostgreSQL and run migrations:
```bash
cd ../db
docker-compose up -d postgres
docker-compose up liquibase
```

#### 2. Run Application

```bash
cd backend
./gradlew bootRun
```

Or on Windows:
```bash
gradlew.bat bootRun
```

Application starts on http://localhost:8080

## Verify Installation

### 1. Health Check
```bash
curl http://localhost:8080/actuator/health
```

### 2. Check Database Connection

Connect to PostgreSQL:
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew
```

List tables:
```sql
\dt
```

You should see 15 business tables + 2 Liquibase tables.

### 3. Check Application Logs

```bash
docker-compose logs backend | grep "Started MkrewBackendApplication"
```

Look for:
```
Started MkrewBackendApplication in X.XXX seconds
```

## Troubleshooting

### Gradle wrapper not found
Download the wrapper JAR (see Prerequisites Setup above).

### Port already in use
Modify `docker-compose.yml` to use different ports:
```yaml
services:
  postgres:
    ports:
      - "5434:5432"  # Change from 5433
  backend:
    ports:
      - "8081:8080"  # Change from 8080
```

### Database connection refused
Ensure PostgreSQL is running:
```bash
docker-compose ps postgres
```

Check database health:
```bash
docker-compose exec postgres pg_isready -U mkrew_user -d mkrew
```

### Liquibase fails
View Liquibase logs:
```bash
docker-compose logs liquibase
```

Re-run migrations:
```bash
docker-compose up liquibase
```

### Application won't start
Check logs:
```bash
docker-compose logs backend
```

Common issues:
- Database not ready: Wait for postgres health check to pass
- Migrations not run: Check liquibase completed successfully
- Port conflict: Change port in docker-compose.yml

## Development Workflow

### 1. Make code changes
Edit files in `src/main/java/`

### 2. Rebuild application
```bash
docker-compose up -d --build backend
```

### 3. View logs
```bash
docker-compose logs -f backend
```

### 4. Stop and clean
```bash
docker-compose down
docker-compose down -v  # Also remove volumes
```

## Next Steps

1. ✅ Application running
2. ⏳ Create repositories (Spring Data JPA)
3. ⏳ Create services (business logic)
4. ⏳ Create REST controllers (API endpoints)
5. ⏳ Add Spring Security
6. ⏳ Add tests

## Useful Commands

### Gradle
```bash
./gradlew build          # Build project
./gradlew test           # Run tests
./gradlew clean          # Clean build artifacts
./gradlew dependencies   # Show dependencies
```

### Docker
```bash
docker-compose up -d              # Start in background
docker-compose down               # Stop services
docker-compose ps                 # List services
docker-compose logs -f backend    # Follow logs
docker-compose restart backend    # Restart service
docker-compose exec backend sh    # Shell into container
```

### Database
```bash
# Connect to database
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew

# Backup database
docker exec mkrew-backend-postgres pg_dump -U mkrew_user mkrew > backup.sql

# Restore database
cat backup.sql | docker exec -i mkrew-backend-postgres psql -U mkrew_user mkrew
```

## Environment Variables

Override in `docker-compose.yml` or create `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mkrew
DB_USER=mkrew_user
DB_PASSWORD=mkrew_password
PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

## Support

For issues, check:
1. This QUICKSTART guide
2. README.md for detailed documentation
3. Application logs: `docker-compose logs backend`
4. Database logs: `docker-compose logs postgres`
