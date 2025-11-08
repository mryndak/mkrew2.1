# Swagger API Documentation

## Overview

mkrew backend API is documented using **OpenAPI 3.0** (formerly Swagger) with **SpringDoc OpenAPI**.

The interactive Swagger UI allows you to:
- Browse all available API endpoints
- View request/response schemas
- Test endpoints directly from the browser
- Authenticate with JWT tokens
- See validation rules and error responses

---

## Accessing Swagger UI

### Local Development

After starting the Spring Boot application, access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```

Or the alternative path:

```
http://localhost:8080/swagger-ui/index.html
```

### OpenAPI JSON Specification

The raw OpenAPI 3.0 specification (JSON format) is available at:

```
http://localhost:8080/v3/api-docs
```

For YAML format:

```
http://localhost:8080/v3/api-docs.yaml
```

---

## Using Swagger UI

### 1. Browse API Endpoints

Swagger UI groups endpoints by tags:
- **Authentication**: User registration, login, email verification, password reset

Each endpoint shows:
- HTTP method (GET, POST, etc.)
- Path
- Description
- Parameters
- Request body schema
- Response schemas
- Example values

### 2. Test Endpoints Without Authentication

Public endpoints can be tested immediately:

**Example: Register a New User**
1. Expand `POST /api/v1/auth/register`
2. Click **"Try it out"**
3. Modify the request body (or use default example)
4. Click **"Execute"**
5. View the response below

### 3. Test Protected Endpoints (JWT Authentication)

Most endpoints require JWT authentication. Follow these steps:

#### Step 1: Register and Login

1. **Register**: Use `POST /api/v1/auth/register` to create account
2. **Verify Email**:
   - Check application logs for verification token
   - Use `GET /api/v1/auth/verify-email?token={token}`
3. **Login**: Use `POST /api/v1/auth/login`
   - Copy the `accessToken` from the response

#### Step 2: Authorize in Swagger UI

1. Click the **"Authorize"** button (lock icon) at the top right
2. In the popup, enter: `Bearer {your-access-token}`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

#### Step 3: Test Protected Endpoints

Now all requests will include the `Authorization: Bearer {token}` header automatically.

**Example: Get User Profile (Future Endpoint)**
1. Expand `GET /api/v1/users/me`
2. Click **"Try it out"**
3. Click **"Execute"**
4. Token is sent automatically in the header

---

## Configuration

### SpringDoc Settings

Configuration in `application.yml`:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    operationsSorter: method
    tagsSorter: alpha
    displayRequestDuration: true
    tryItOutEnabled: true
  show-actuator: false
```

**Settings Explained:**
- `operationsSorter: method`: Sort endpoints by HTTP method (GET, POST, etc.)
- `tagsSorter: alpha`: Sort tags alphabetically
- `displayRequestDuration: true`: Show request execution time
- `tryItOutEnabled: true`: Enable "Try it out" button by default
- `show-actuator: false`: Hide Spring Boot Actuator endpoints

### Security Configuration

Swagger UI endpoints are publicly accessible (configured in `SecurityConfig.java`):

```java
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
```

---

## API Information

The API metadata is configured in `OpenApiConfig.java`:

```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("mkrew API")
                .version("1.0.0")
                .description("REST API for mkrew - Blood Donation Center Status Tracker")
                .contact(new Contact()
                    .name("mkrew Team")
                    .email("contact@mkrew.pl")))
            // ... security schemes, servers, etc.
    }
}
```

---

## Example Workflow

### Complete Registration and Login Flow

**1. Register User**
```
POST /api/v1/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "consentVersion": "1.0",
  "consentAccepted": true
}
```

**Response:** User ID and message

**2. Verify Email**
```
# Get token from application logs (until email service is implemented)
# Look for: "Verification email would be sent to: test@example.com with token: {token}"

GET /api/v1/auth/verify-email?token={token-from-logs}
```

**Response:** "Email verified successfully. You can now log in."

**3. Login**
```
POST /api/v1/auth/login
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "bloodGroup": "A+",
    "emailVerified": true,
    "role": "USER"
  }
}
```

**4. Use Access Token**

Click **"Authorize"** button in Swagger UI and enter:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Now you can test all protected endpoints!

---

## Schemas and Models

Swagger UI automatically generates schemas from Java DTOs:

**Request DTOs:**
- `RegisterRequest`
- `LoginRequest`
- `PasswordResetRequestDto`
- `PasswordResetConfirmDto`

**Response DTOs:**
- `RegisterResponse`
- `LoginResponse`
- `VerifyEmailResponse`
- `PasswordResetResponse`
- `UserDto`
- `ErrorResponse`

Click on any schema in Swagger UI to see:
- Field types
- Required fields
- Validation rules (min length, regex patterns, etc.)
- Example values

---

## Error Responses

Swagger UI documents all error responses:

**400 Bad Request - Validation Error**
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/auth/register",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid",
      "rejectedValue": "invalid-email"
    }
  ]
}
```

**401 Unauthorized - Invalid Credentials**
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "path": "/api/v1/auth/login"
}
```

**429 Too Many Requests - Rate Limited**
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 429,
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Account temporarily locked. Please try again in 5 minutes.",
  "path": "/api/v1/auth/login"
}
```

---

## Tips and Tricks

### 1. Copy cURL Commands

Swagger UI generates cURL commands for each request:
1. Execute a request in Swagger UI
2. Scroll down to the response section
3. Click **"Curl"** tab
4. Copy the command to use in terminal

### 2. Download OpenAPI Spec

Export the API specification:
1. Visit `http://localhost:8080/v3/api-docs`
2. Save the JSON file
3. Import into other tools (Postman, Insomnia, etc.)

### 3. Generate Client SDKs

Use the OpenAPI spec to generate client libraries:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-axios \
  -o ./frontend/src/api
```

### 4. Test Validation Rules

Swagger UI shows validation constraints:
- Try submitting invalid data (e.g., weak password, invalid email)
- See real-time validation errors
- Understand password complexity requirements

### 5. Monitor Request Duration

With `displayRequestDuration: true`, you can:
- See how long each request takes
- Identify slow endpoints
- Optimize performance

---

## Production Considerations

### Disable Swagger in Production

For security reasons, disable Swagger UI in production:

**application-prod.yml:**
```yaml
springdoc:
  swagger-ui:
    enabled: false
  api-docs:
    enabled: false
```

Or use environment variable:
```
SPRINGDOC_SWAGGER_UI_ENABLED=false
```

### Protect Swagger with Authentication

Alternatively, protect Swagger UI with authentication:

**SecurityConfig.java:**
```java
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
    .hasRole("ADMIN")
```

### Host OpenAPI Spec Separately

Host the OpenAPI JSON spec on a CDN:
1. Generate spec: `http://localhost:8080/v3/api-docs`
2. Save to file: `openapi.json`
3. Upload to CDN/S3
4. Use with external tools (Stoplight, ReadMe.io, etc.)

---

## Troubleshooting

### Swagger UI Not Loading

**Problem:** 404 error when accessing `/swagger-ui.html`

**Solutions:**
1. Check application started successfully
2. Verify `springdoc-openapi-starter-webmvc-ui` dependency in `build.gradle`
3. Check `application.yml` has `springdoc.swagger-ui.enabled: true`
4. Ensure SecurityConfig permits Swagger endpoints

### Authorization Not Working

**Problem:** 401 Unauthorized after clicking "Authorize"

**Solutions:**
1. Verify token format: `Bearer eyJhbGci...` (note the space after "Bearer")
2. Check token hasn't expired (1 hour TTL)
3. Ensure user's email is verified
4. Try logging in again to get fresh token

### Missing Endpoints in Swagger

**Problem:** Some controllers/endpoints not showing

**Solutions:**
1. Ensure controller has `@RestController` annotation
2. Check package is scanned by Spring Boot
3. Verify methods have HTTP mapping annotations (`@GetMapping`, etc.)
4. Restart application

---

## Related Documentation

- API Documentation: `backend/docs/`
  - `API-REGISTRATION.md`
  - `API-EMAIL-VERIFICATION.md`
  - `API-LOGIN.md`
  - `API-PASSWORD-RESET.md`
- OpenAPI Specification: `http://localhost:8080/v3/api-docs`
- SpringDoc Documentation: https://springdoc.org/

---

## Next Steps

1. ✅ Swagger UI configured and accessible
2. ✅ JWT authentication documented
3. ⏳ Add more controller tags as new endpoints are created
4. ⏳ Document query parameters with `@Parameter` annotation
5. ⏳ Add example values with `@Schema(example = "...")`
6. ⏳ Configure production security (disable or protect Swagger)
