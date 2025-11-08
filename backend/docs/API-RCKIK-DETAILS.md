# RCKiK Details API - Implementation Guide

## Implemented: US-008 - View Center Details and Trends

### Overview
Public endpoints for viewing detailed information about specific blood donation centers and their historical blood level data. Both endpoints are publicly accessible - no authentication required.

---

## Part 1: Get RCKiK Center Details

### Endpoint
```
GET /api/v1/rckik/{id}
```

### Description
Returns detailed information about a specific RCKiK blood donation center including current blood levels, scraping status, location, aliases, and metadata.

### Request

**Method:** GET

**Path Parameters:**
- `id` (required): RCKiK center unique identifier

**Example:**
```
GET /api/v1/rckik/1
```

### Success Response

**Status Code:** `200 OK`

**Body:**
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
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2025-01-05T10:00:00",
  "currentBloodLevels": [
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
  ],
  "lastSuccessfulScrape": "2025-01-08T02:30:00",
  "scrapingStatus": "OK"
}
```

**Field Descriptions:**
- `scrapingStatus`: Web scraping status
  - `OK`: Last scrape was successful
  - `DEGRADED`: Last scrape was partial (some data missing)
  - `FAILED`: Last scrape failed completely
  - `UNKNOWN`: No scraping data available
- `aliases`: Alternative names used for scraping/matching
- Other fields same as in US-007 list endpoint

### Error Responses

**404 Not Found:**
```json
{
  "timestamp": "2025-01-08T20:00:00",
  "status": 404,
  "error": "RESOURCE_NOT_FOUND",
  "message": "RCKiK center not found with ID: 999",
  "path": "/api/v1/rckik/999"
}
```

### Testing with cURL

```bash
# Get details for specific center
curl -X GET "http://localhost:8080/api/v1/rckik/1"

# Expected response includes all center details and current blood levels
```

---

## Part 2: Get Blood Level History

### Endpoint
```
GET /api/v1/rckik/{id}/blood-levels
```

### Description
Returns historical blood level snapshots for a specific center with optional filtering by blood group and date range. Results are paginated and ordered by date descending (newest first).

### Request

**Method:** GET

**Path Parameters:**
- `id` (required): RCKiK center unique identifier

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bloodGroup` | String | No | null | Filter by blood group (e.g., "A+", "0-") |
| `fromDate` | Date | No | null | Start date (ISO 8601: YYYY-MM-DD) |
| `toDate` | Date | No | null | End date (ISO 8601: YYYY-MM-DD) |
| `page` | Integer | No | 0 | Page number (zero-based) |
| `size` | Integer | No | 30 | Page size (max: 100) |

**Example:**
```
GET /api/v1/rckik/1/blood-levels?bloodGroup=A%2B&fromDate=2024-12-01&toDate=2025-01-08&page=0&size=30
```

### Success Response

**Status Code:** `200 OK`

**Body:**
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
      "scrapedAt": "2025-01-08T02:30:00",
      "isManual": false
    },
    {
      "id": 982,
      "snapshotDate": "2025-01-07",
      "bloodGroup": "A+",
      "levelPercentage": 42.00,
      "levelStatus": "IMPORTANT",
      "scrapedAt": "2025-01-07T02:30:00",
      "isManual": false
    }
  ],
  "page": 0,
  "size": 30,
  "totalElements": 240,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

**Field Descriptions:**
- `snapshotDate`: Date of the blood level measurement
- `scrapedAt`: Exact timestamp when data was collected
- `isManual`: Whether snapshot was created manually (true) or by scraper (false)
- Pagination fields same as in US-007

### Error Responses

**404 Not Found:** Center doesn't exist (same as detail endpoint)

**400 Bad Request:** Invalid date format or parameters

### Testing with cURL

#### Get All History (No Filters)
```bash
curl -X GET "http://localhost:8080/api/v1/rckik/1/blood-levels"
```

#### Filter by Blood Group
```bash
curl -X GET "http://localhost:8080/api/v1/rckik/1/blood-levels?bloodGroup=A%2B"
```

#### Filter by Date Range
```bash
curl -X GET "http://localhost:8080/api/v1/rckik/1/blood-levels?fromDate=2024-12-01&toDate=2025-01-08"
```

#### Combined Filters with Pagination
```bash
curl -X GET "http://localhost:8080/api/v1/rckik/1/blood-levels?bloodGroup=0-&fromDate=2024-11-01&toDate=2025-01-08&page=0&size=50"
```

---

## Implementation Details

### Files Created

**DTOs:**
- `RckikDetailDto.java` - Detailed center information with metadata
- `BloodLevelHistoryDto.java` - Historical snapshot entry
- `BloodLevelHistoryResponse.java` - Paginated history response

**Repositories:**
- `ScraperLogRepository.java` - Scraping status queries
- `BloodSnapshotRepository.java` - Extended with pagination methods

**Service:**
- `RckikService.java` - Extended with:
  - `getRckikDetail(id)` - Get center details
  - `getBloodLevelHistory(...)` - Get historical snapshots with filters

**Controller:**
- `RckikController.java` - Extended with:
  - `GET /api/v1/rckik/{id}` - Center details
  - `GET /api/v1/rckik/{id}/blood-levels` - History

### Key Features

**Smart Filtering:**
- Blood group filter
- Date range filter (inclusive)
- Combination of filters
- All filters optional

**Performance Optimization:**
- Pagination prevents large data transfers
- Indexed queries (snapshot_date, blood_group)
- Read-only transactions
- Ordered by date descending (newest first)

**Scraping Status Logic:**
```java
SUCCESS → OK
PARTIAL → DEGRADED
FAILED → FAILED
null → UNKNOWN
```

---

## Use Cases

### Dashboard Detail View
Show complete information about a center when user clicks from list:
```bash
GET /api/v1/rckik/1
```

### Trend Analysis for Specific Blood Group
Analyze A+ blood levels over past 30 days:
```bash
GET /api/v1/rckik/1/blood-levels?bloodGroup=A%2B&fromDate=2024-12-09&toDate=2025-01-08
```

### Historical Chart Data
Fetch data for displaying trend charts on frontend:
```bash
GET /api/v1/rckik/1/blood-levels?bloodGroup=0-&size=90
# Returns last 90 snapshots for charting
```

---

## Integration with Other User Stories

### Prerequisites
- **US-007 (List Centers)**: Provides IDs for detail view

### Enables
- **Frontend Detail Pages**: Show center information
- **Trend Charts**: Historical data for visualization
- **User Decisions**: See trends before donating
- **Scraping Monitoring**: Track scraper health

---

## Testing Checklist

### Get Center Details
- [ ] Valid ID returns 200 with complete data
- [ ] Invalid ID returns 404
- [ ] Current blood levels included
- [ ] Scraping status calculated correctly
- [ ] All metadata fields present

### Get Blood Level History
- [ ] No filters returns all snapshots paginated
- [ ] Blood group filter works correctly
- [ ] Date range filter works (fromDate/toDate)
- [ ] Combined filters work together
- [ ] Pagination works (page/size)
- [ ] Invalid date format returns 400
- [ ] Non-existent center returns 404
- [ ] Results ordered by date descending

---

## Next Steps

1. ✅ Browse Blood Centers (US-007) - IMPLEMENTED
2. ✅ View Center Details and Trends (US-008) - IMPLEMENTED
3. ⏳ Favorite RCKiK Management (US-009)
4. ⏳ Email Notifications (US-010)
5. ⏳ Web Scraper Implementation

---

## Related Documentation

- List Blood Centers: `API-RCKIK-LIST.md`
- User Profile: `API-USER-PROFILE.md`
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md`
- PRD: `../.ai/prd.md`
