# RCKiK List API - Implementation Guide

## Implemented: US-007 - Browse Blood Centers

### Overview
Public endpoint for browsing blood donation centers (RCKiK) with current blood levels. No authentication required - accessible to all users (logged in or anonymous).

---

## Public Endpoint - No Authentication

This endpoint is publicly accessible and does NOT require JWT authentication. Anyone can access blood center information and current blood levels.

---

## Endpoint

### List RCKiK Blood Donation Centers

```
GET /api/v1/rckik
```

### Description
Returns paginated list of blood donation centers with current blood levels. Shows names, locations, and latest blood inventory status for each blood group.

### Request

**Method:** GET

**Headers:**
```
Content-Type: application/json
```

**No authentication required**

### Query Parameters

All parameters are optional:

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `page` | Integer | 0 | Page number (zero-based) | 0 |
| `size` | Integer | 20 | Page size (max: 100) | 20 |
| `city` | String | null | Filter by city name | "Warszawa" |
| `active` | Boolean | true | Filter by active status | true |
| `sortBy` | String | "name" | Sort field (name, city, code) | "name" |
| `sortOrder` | String | "ASC" | Sort order (ASC, DESC) | "ASC" |

### Success Response

**Status Code:** `200 OK`

**Body:**
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
          "lastUpdate": "2025-01-08T02:30:00"
        },
        {
          "bloodGroup": "0-",
          "levelPercentage": 15.00,
          "levelStatus": "CRITICAL",
          "lastUpdate": "2025-01-08T02:30:00"
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

**Field Descriptions:**

**RCKiK Center Fields:**
- `id`: Unique identifier
- `name`: Full name of blood donation center
- `code`: Unique code (e.g., "RCKIK-WAW")
- `city`: City name
- `address`: Full address
- `latitude`: Geographic latitude (for map display)
- `longitude`: Geographic longitude (for map display)
- `active`: Whether center is currently active

**Blood Level Fields:**
- `bloodGroup`: Blood group (0+, 0-, A+, A-, B+, B-, AB+, AB-)
- `levelPercentage`: Current blood level as percentage
- `levelStatus`: Status based on percentage
  - **CRITICAL**: < 20% (urgent need)
  - **IMPORTANT**: < 50% (moderate need)
  - **OK**: >= 50% (sufficient supply)
- `lastUpdate`: Timestamp of last scraping/update

**Pagination Fields:**
- `page`: Current page number (zero-based)
- `size`: Number of items per page
- `totalElements`: Total number of centers matching filters
- `totalPages`: Total number of pages
- `first`: Is this the first page?
- `last`: Is this the last page?

### Error Responses

#### Bad Request (400)
Invalid request parameters:
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Invalid page size. Maximum is 100.",
  "path": "/api/v1/rckik"
}
```

### Business Logic

1. **Default Filters**: By default, shows only active centers (`active=true`)
2. **Pagination**: Returns 20 centers per page by default
3. **Blood Levels**: Shows latest snapshot for each blood group
4. **Status Calculation**: Automatically calculated based on percentage:
   - CRITICAL: < 20%
   - IMPORTANT: < 50%
   - OK: >= 50%
5. **Sorting**: Default sort by name (alphabetical)
6. **Performance**: Uses optimized queries to fetch blood levels for all centers on page in single query

### Testing with cURL

#### Get First Page (Default Parameters)
```bash
curl -X GET "http://localhost:8080/api/v1/rckik"
```

**Expected Response:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "RCKiK Białystok",
      "code": "RCKIK-BIA",
      "city": "Białystok",
      "address": "ul. M. Skłodowskiej-Curie 23, 15-950 Białystok",
      "latitude": 53.1325,
      "longitude": 23.1688,
      "active": true,
      "bloodLevels": [...]
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

#### Filter by City
```bash
curl -X GET "http://localhost:8080/api/v1/rckik?city=Warszawa"
```

#### Get Specific Page
```bash
curl -X GET "http://localhost:8080/api/v1/rckik?page=1&size=10"
```

#### Sort by City Descending
```bash
curl -X GET "http://localhost:8080/api/v1/rckik?sortBy=city&sortOrder=DESC"
```

#### Show All Centers (Including Inactive)
```bash
curl -X GET "http://localhost:8080/api/v1/rckik?active=false"
```

#### Combined Filters
```bash
curl -X GET "http://localhost:8080/api/v1/rckik?city=Warszawa&page=0&size=5&sortBy=name&sortOrder=ASC"
```

---

## Database Queries

### Tables Accessed

**`rckik`** - Blood donation centers (canonical list)
```sql
SELECT * FROM rckik
WHERE active = true
  AND (city = ? OR ? IS NULL)
ORDER BY name ASC
LIMIT 20 OFFSET 0;
```

**`blood_snapshots`** - Blood inventory snapshots
```sql
SELECT bs.* FROM blood_snapshots bs
WHERE bs.rckik_id IN (1, 2, 3, ...)
  AND bs.id IN (
    SELECT MAX(bs2.id)
    FROM blood_snapshots bs2
    WHERE bs2.rckik_id IN (1, 2, 3, ...)
    GROUP BY bs2.rckik_id, bs2.blood_group
  )
ORDER BY bs.rckik_id ASC, bs.blood_group ASC;
```

### Performance Optimization

1. **Pagination**: Uses Spring Data JPA pagination (LIMIT/OFFSET)
2. **Batch Blood Level Fetch**: Fetches blood levels for all centers on page in single query
3. **Index Usage**:
   - `idx_rckik_active`: Filter by active status
   - `idx_rckik_code`: Sorting and unique lookups
   - `idx_blood_snapshots_rckik_date_group`: Latest snapshot per blood group
4. **Read-Only Transaction**: `@Transactional(readOnly = true)` for performance

---

## Implementation Details

### Files Created/Modified

**DTOs:**
- `BloodLevelDto.java` - Blood level information for single blood group
- `RckikSummaryDto.java` - RCKiK center summary with blood levels
- `RckikListResponse.java` - Paginated response with metadata

**Repository:**
- `RckikRepository.java` - Enhanced with pagination methods
  - `findByActive(Boolean, Pageable)` - Filter by active status
  - `findByCityAndActive(String, Boolean, Pageable)` - Filter by city and active
  - `findByCity(String, Pageable)` - Filter by city only
- `BloodSnapshotRepository.java` - New repository for blood snapshots
  - `findLatestByRckikId(Long)` - Latest snapshots for single center
  - `findLatestByRckikIds(List<Long>)` - Latest snapshots for multiple centers (optimized)

**Service:**
- `RckikService.java` - Business logic
  - `getRckikList(...)` - Main method with filtering, pagination, sorting
  - `mapToSummaryDto(...)` - Map entity to DTO
  - `mapToBloodLevelDto(...)` - Map blood snapshot to DTO
  - `calculateLevelStatus(...)` - Calculate CRITICAL/IMPORTANT/OK status
  - `isValidSortField(...)` - Validate sort field (security)

**Controller:**
- `RckikController.java` - REST endpoint
  - `GET /api/v1/rckik` - List centers with query parameters
  - Full Swagger annotations
  - Public access (no JWT required)

**Security:**
- `SecurityConfig.java` - Updated to allow public access
  - Added `.requestMatchers("/api/v1/rckik/**").permitAll()`

### Service Method

```java
@Transactional(readOnly = true)
public RckikListResponse getRckikList(
        Integer page, Integer size, String city, Boolean active,
        String sortBy, String sortOrder) {

    // Validate and set defaults
    int pageNumber = (page != null && page >= 0) ? page : 0;
    int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
    Boolean activeFilter = (active != null) ? active : true;

    // Create pageable with sorting
    Pageable pageable = PageRequest.of(pageNumber, pageSize,
        Sort.by(direction, sortField));

    // Query with filters
    Page<Rckik> rckikPage;
    if (city != null && !city.trim().isEmpty()) {
        rckikPage = rckikRepository.findByCityAndActive(city, activeFilter, pageable);
    } else {
        rckikPage = rckikRepository.findByActive(activeFilter, pageable);
    }

    // Get RCKiK IDs from page
    List<Long> rckikIds = rckikPage.getContent().stream()
        .map(Rckik::getId)
        .collect(Collectors.toList());

    // Fetch latest blood snapshots (optimized - single query)
    List<BloodSnapshot> snapshots =
        bloodSnapshotRepository.findLatestByRckikIds(rckikIds);

    // Group by RCKiK ID
    Map<Long, List<BloodSnapshot>> snapshotsByRckikId = snapshots.stream()
        .collect(Collectors.groupingBy(bs -> bs.getRckik().getId()));

    // Map to DTOs
    List<RckikSummaryDto> content = rckikPage.getContent().stream()
        .map(rckik -> {
            List<BloodSnapshot> rckikSnapshots =
                snapshotsByRckikId.getOrDefault(rckik.getId(), List.of());
            return mapToSummaryDto(rckik, rckikSnapshots);
        })
        .collect(Collectors.toList());

    return RckikListResponse.builder()
        .content(content)
        .page(pageNumber)
        .size(pageSize)
        .totalElements(rckikPage.getTotalElements())
        .totalPages(rckikPage.getTotalPages())
        .first(rckikPage.isFirst())
        .last(rckikPage.isLast())
        .build();
}
```

### Blood Level Status Calculation

```java
private String calculateLevelStatus(BigDecimal levelPercentage) {
    if (levelPercentage == null) {
        return "UNKNOWN";
    }

    if (levelPercentage.compareTo(new BigDecimal("20")) < 0) {
        return "CRITICAL";  // < 20%
    } else if (levelPercentage.compareTo(new BigDecimal("50")) < 0) {
        return "IMPORTANT"; // < 50%
    } else {
        return "OK";        // >= 50%
    }
}
```

---

## Security Considerations

### Public Access
- ✅ No authentication required (public health information)
- ✅ Read-only access (no mutations)
- ✅ No sensitive data exposed (only blood levels and center info)

### Input Validation
- ✅ Page and size validated (prevent negative values, limit max size to 100)
- ✅ Sort field validated against whitelist (prevent SQL injection)
- ✅ City parameter sanitized (trimmed)

### Performance Protection
- ✅ Max page size: 100 (prevent excessive data retrieval)
- ✅ Pagination enforced (cannot retrieve all data at once)
- ✅ Optimized queries (batch fetching of blood levels)

### Data Integrity
- ✅ Only active centers shown by default
- ✅ Latest blood snapshot per blood group
- ✅ Consistent sorting

---

## Use Cases

### Dashboard Display
Show all blood donation centers with current status:
```bash
GET /api/v1/rckik?page=0&size=50
```

### Find Nearest Centers (by City)
Find centers in user's city:
```bash
GET /api/v1/rckik?city=Kraków
```

### Critical Blood Alert View
Frontend can filter client-side for CRITICAL status or request all and filter:
```bash
GET /api/v1/rckik?size=100
# Filter bloodLevels array for levelStatus === "CRITICAL" on frontend
```

### Mobile App - Initial Load
Load first page with smaller size:
```bash
GET /api/v1/rckik?page=0&size=10
```

### Admin View - All Centers
Show all centers including inactive:
```bash
GET /api/v1/rckik?active=false&size=100
```

---

## Verification Queries

### Check RCKiK Centers in Database
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT id, name, code, city, active
      FROM rckik
      WHERE active = true
      ORDER BY name
      LIMIT 10;"
```

### Check Latest Blood Snapshots
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT bs.rckik_id, r.name, bs.blood_group, bs.level_percentage, bs.scraped_at
      FROM blood_snapshots bs
      JOIN rckik r ON r.id = bs.rckik_id
      WHERE bs.rckik_id = 1
      ORDER BY bs.snapshot_date DESC, bs.scraped_at DESC
      LIMIT 10;"
```

### Verify Blood Level Status Calculation
```bash
docker exec -it mkrew-backend-postgres psql -U mkrew_user -d mkrew \
  -c "SELECT
        blood_group,
        level_percentage,
        CASE
          WHEN level_percentage < 20 THEN 'CRITICAL'
          WHEN level_percentage < 50 THEN 'IMPORTANT'
          ELSE 'OK'
        END as calculated_status
      FROM blood_snapshots
      WHERE rckik_id = 1
      ORDER BY blood_group;"
```

---

## Testing Checklist

### Basic Functionality
- [ ] Get first page with default parameters returns 200 OK
- [ ] Response contains list of centers with blood levels
- [ ] Pagination metadata is correct (page, size, totalElements, etc.)
- [ ] Only active centers shown by default
- [ ] Blood levels array contains data for each blood group

### Filtering
- [ ] Filter by city returns only centers in that city
- [ ] Filter by active=false shows inactive centers
- [ ] Combined filters work correctly
- [ ] Empty city parameter is ignored (shows all)

### Pagination
- [ ] page=0 returns first page
- [ ] page=1 returns second page
- [ ] size parameter controls items per page
- [ ] size > 100 is rejected or capped at 100
- [ ] first=true on first page
- [ ] last=true on last page
- [ ] totalElements matches database count

### Sorting
- [ ] sortBy=name sorts alphabetically
- [ ] sortBy=city sorts by city
- [ ] sortBy=code sorts by code
- [ ] sortOrder=ASC sorts ascending
- [ ] sortOrder=DESC sorts descending
- [ ] Invalid sortBy uses default (name)

### Blood Level Status
- [ ] levelStatus="CRITICAL" when percentage < 20
- [ ] levelStatus="IMPORTANT" when percentage < 50
- [ ] levelStatus="OK" when percentage >= 50
- [ ] All 8 blood groups present (if data exists)

### Performance
- [ ] Response time < 500ms for page of 20 centers
- [ ] Blood levels fetched in single query (check logs)
- [ ] Pagination uses LIMIT/OFFSET

### Public Access
- [ ] Endpoint accessible without JWT token
- [ ] No authentication errors for anonymous users

---

## Integration with Other User Stories

### Enables
- **US-008 (RCKiK Details)**: List provides IDs for detail view
- **US-009 (Favorite RCKiK)**: Users can select from this list to favorite
- **US-010 (Email Notifications)**: Critical/Important status triggers alerts
- **Frontend Dashboard**: Main data source for blood center display

### Data Flow
1. **Web Scraper** → Populates `blood_snapshots` table daily
2. **This API** → Reads latest snapshots and presents to users
3. **Frontend** → Displays centers and blood levels
4. **User Actions** → Select favorites, view details

---

## Next Steps

1. ✅ User Registration (US-001) - IMPLEMENTED
2. ✅ Email Verification (US-002) - IMPLEMENTED
3. ✅ User Login (US-003) - IMPLEMENTED
4. ✅ Password Reset (US-004) - IMPLEMENTED
5. ✅ User Profile Management (US-005) - IMPLEMENTED
6. ✅ Notification Preferences (US-006) - IMPLEMENTED
7. ✅ Browse Blood Centers (US-007) - IMPLEMENTED
8. ⏳ RCKiK Details View (US-008)
9. ⏳ Favorite RCKiK Management (US-009)
10. ⏳ Email Notifications (US-010)
11. ⏳ Web Scraper Implementation

---

## Related Documentation

- User Registration: `API-REGISTRATION.md`
- User Login: `API-LOGIN.md`
- User Profile: `API-USER-PROFILE.md`
- Notification Preferences: `API-NOTIFICATION-PREFERENCES.md`
- Swagger UI: `SWAGGER.md`
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md`
- PRD: `../.ai/prd.md`
