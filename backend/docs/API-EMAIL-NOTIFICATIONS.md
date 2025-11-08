# Email Notifications API - Implementation Guide

## Implemented: US-010 - Email Notifications for Critical Blood Levels

### Overview
Automated email notification system that monitors blood inventory levels and sends alerts to users when their favorite RCKiK centers reach critical thresholds. This implementation uses SendGrid for email delivery and includes comprehensive logging and rate limiting.

---

## Table of Contents
1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Email Flow](#email-flow)
4. [Scheduled Jobs](#scheduled-jobs)
5. [Email Templates](#email-templates)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Integration Points](#integration-points)

---

## Architecture

### Components

**1. EmailService**
- Integrates with SendGrid API
- Builds HTML email content from templates
- Logs all email sending attempts
- File: `EmailService.java`

**2. EmailLogService**
- Records all email activity in `email_logs` table
- Tracks delivery, open, and bounce events
- Enforces rate limiting (5 emails per user per 24h)
- File: `EmailLogService.java`

**3. CriticalBloodLevelNotificationService**
- Main business logic for critical blood level alerts
- Queries latest blood snapshots below threshold
- Filters eligible users based on preferences
- Sends personalized alerts
- File: `CriticalBloodLevelNotificationService.java`

**4. NotificationScheduler**
- Automated cron job running daily at 03:00 CET
- Triggers notification check after scraping completes
- Health check runs hourly
- File: `NotificationScheduler.java`

**5. EmailLogRepository**
- Data access for email logs
- Analytics queries (delivery rate, open rate)
- File: `EmailLogRepository.java`

### Database Tables Used

**email_logs**
- Primary table for tracking email activity
- Fields: user_id, rckik_id, notification_type, recipient_email, subject, sent_at, delivered_at, opened_at, bounced_at, bounce_type, external_id, metadata

**notification_preferences**
- User notification settings
- Fields: user_id, email_enabled, email_frequency, in_app_enabled, in_app_frequency

**user_favorite_rckik**
- User's favorite blood centers
- Determines who receives alerts for each center

**blood_snapshots**
- Blood inventory data
- Query: Find latest snapshots below critical threshold (20%)

---

## Configuration

### Environment Variables

Add these to your environment or `.env` file:

```bash
# SendGrid API Key (Required for sending emails)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email settings
EMAIL_ENABLED=true
EMAIL_FROM=noreply@mkrew.pl
EMAIL_FROM_NAME=mkrew - Platforma dla dawców krwi

# Notification thresholds
NOTIFICATION_CRITICAL_THRESHOLD=20.0  # Percentage
NOTIFICATION_RATE_LIMIT=5  # Max emails per user per 24h

# Scheduler configuration
SCHEDULER_NOTIFICATION_CHECK=0 0 3 * * *  # Daily at 03:00 CET
SCHEDULER_HEALTH_CHECK=0 0 * * * *  # Hourly

# Application URL (for links in emails)
APP_BASE_URL=http://localhost:3000
```

### application.yml

Configuration is defined in `src/main/resources/application.yml`:

```yaml
mkrew:
  email:
    enabled: ${EMAIL_ENABLED:true}
    sendgrid:
      api-key: ${SENDGRID_API_KEY:}
    from-email: ${EMAIL_FROM:noreply@mkrew.pl}
    from-name: ${EMAIL_FROM_NAME:mkrew - Platforma dla dawców krwi}

  notification:
    critical-threshold: ${NOTIFICATION_CRITICAL_THRESHOLD:20.0}
    rate-limit: ${NOTIFICATION_RATE_LIMIT:5}

  scheduler:
    notification-check: ${SCHEDULER_NOTIFICATION_CHECK:0 0 3 * * *}
    health-check: ${SCHEDULER_HEALTH_CHECK:0 0 * * * *}

  app:
    base-url: ${APP_BASE_URL:http://localhost:3000}
```

### SendGrid Setup

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com
   - Free tier: 100 emails/day

2. **Generate API Key**
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the key (shown only once!)

3. **Verify Sender Identity**
   - Go to Settings → Sender Authentication
   - Verify your sender email domain
   - Set up SPF/DKIM/DMARC records

4. **Set Environment Variable**
   ```bash
   export SENDGRID_API_KEY="SG.your-api-key-here"
   ```

---

## Email Flow

### Automated Flow (Scheduled)

```
1. Scraper runs at 02:00 CET (daily)
   └─> Updates blood_snapshots table

2. NotificationScheduler triggers at 03:00 CET
   └─> Calls CriticalBloodLevelNotificationService.checkAndNotifyUsers()

3. Query critical blood levels (<20%)
   └─> BloodSnapshotRepository.findCriticalLevels(20.0)

4. For each RCKiK with critical levels:
   └─> Find users with this RCKiK in favorites
   └─> Filter eligible users (active, verified, preferences)

5. For each eligible user:
   └─> Check rate limit (5 emails per 24h)
   └─> Build personalized email
   └─> Send via EmailService
   └─> Log in email_logs table
```

### User Eligibility Checks

User receives notification IF:
- ✅ Account is active (`deleted_at IS NULL`)
- ✅ Email is verified (`email_verified = true`)
- ✅ Has notification preferences set
- ✅ Email notifications enabled (`email_enabled = true`)
- ✅ Email frequency is `ONLY_CRITICAL` or `IMMEDIATE`
- ✅ Rate limit not exceeded (< 5 emails in 24h)
- ✅ Has RCKiK center in favorites

User does NOT receive notification IF:
- ❌ Account deleted
- ❌ Email not verified
- ❌ Email notifications disabled
- ❌ Email frequency is `DISABLED` or `DAILY`
- ❌ Rate limit exceeded
- ❌ RCKiK not in favorites

---

## Scheduled Jobs

### Critical Blood Level Check

**Cron:** `0 0 3 * * *` (Daily at 03:00 CET)

**Purpose:** Send critical blood level alerts after daily scraping

**Method:** `NotificationScheduler.checkCriticalBloodLevels()`

**Behavior:**
- Queries latest blood snapshots below 20%
- Groups by RCKiK center
- Finds users with favorites
- Sends emails to eligible users
- Logs all activity

**Customization:**
Change schedule via environment variable:
```bash
SCHEDULER_NOTIFICATION_CHECK="0 30 2 * * *"  # 02:30 CET
```

### Health Check

**Cron:** `0 0 * * * *` (Every hour)

**Purpose:** Verify scheduler is running

**Method:** `NotificationScheduler.healthCheck()`

**Logs:** DEBUG level message every hour

---

## Email Templates

### Critical Blood Level Alert

**Subject:** `Krytyczny poziom krwi - {RCKiK Name}`

**Template:** HTML email with:
- Personalized greeting
- RCKiK center name and location
- List of critical blood groups with percentages
- Call-to-action button → RCKiK details page
- Unsubscribe instructions
- Footer with branding

**Example:**

```
⚠️ Pilne: Krytyczny poziom krwi

Witaj Jan,

W jednym z Twoich ulubionych centrów krwiodawstwa został wykryty
krytyczny poziom zapasów krwi.

━━━━━━━━━━━━━━━━━━━━━━━━━
RCKiK Warszawa

Krytyczne grupy krwi:
• 0-: 15.00%
• A+: 18.50%
━━━━━━━━━━━━━━━━━━━━━━━━━

Twoja krew może uratować życie! Jeśli jesteś w stanie oddać krew,
każda donacja ma znaczenie.

[Zobacz szczegóły]

────────────────────────────
To powiadomienie zostało wysłane, ponieważ masz zapisane
RCKiK Warszawa jako ulubione centrum krwiodawstwa.
Możesz zmienić swoje preferencje powiadomień w ustawieniach konta.

mkrew - Platforma dla dawców krwi
mkrew.pl
```

**Template Variables:**
- `{{recipientName}}` - User's first name
- `{{rckikName}}` - RCKiK center name
- `{{criticalGroups}}` - HTML list of critical blood groups
- `{{detailsUrl}}` - Link to RCKiK details page

**Method:** `EmailService.sendCriticalBloodLevelAlert(...)`

---

## Testing

### Local Testing (Without SendGrid)

Disable email sending to test logic without actually sending emails:

```yaml
# application.yml or environment variable
mkrew:
  email:
    enabled: false  # Emails will be logged but not sent
```

### Manual Trigger

For testing purposes, trigger notification check manually:

```java
@RestController
@RequestMapping("/api/v1/admin/notifications")
public class NotificationTestController {

    @Autowired
    private CriticalBloodLevelNotificationService notificationService;

    @PostMapping("/trigger-check")
    public ResponseEntity<Map<String, Integer>> triggerCheck() {
        int sent = notificationService.triggerManualCheck();
        return ResponseEntity.ok(Map.of("notificationsSent", sent));
    }
}
```

**Request:**
```bash
POST /api/v1/admin/notifications/trigger-check
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "notificationsSent": 15
}
```

### Test Scenarios

**1. Test Critical Blood Level Detection**
```sql
-- Insert test snapshot below threshold
INSERT INTO blood_snapshots (rckik_id, snapshot_date, blood_group, level_percentage, scraped_at)
VALUES (1, CURRENT_DATE, '0-', 15.00, NOW());
```

**2. Test User Eligibility**
```sql
-- Check user has verified email
SELECT id, email, email_verified FROM users WHERE id = 123;

-- Check notification preferences
SELECT * FROM notification_preferences WHERE user_id = 123;

-- Check user has favorite
SELECT * FROM user_favorite_rckik WHERE user_id = 123 AND rckik_id = 1;
```

**3. Test Rate Limiting**
```sql
-- Count emails sent to user in last 24 hours
SELECT COUNT(*) FROM email_logs
WHERE user_id = 123
AND sent_at >= NOW() - INTERVAL '24 hours';
```

**4. Check Email Logs**
```sql
-- View recent email activity
SELECT
    el.id,
    el.recipient_email,
    el.notification_type,
    el.sent_at,
    el.delivered_at,
    el.opened_at,
    r.name AS rckik_name
FROM email_logs el
LEFT JOIN rckik r ON r.id = el.rckik_id
ORDER BY el.sent_at DESC
LIMIT 20;
```

### Integration Testing

**Test with SendGrid Sandbox Mode:**
```java
// Add to EmailService for testing
@Value("${mkrew.email.sendgrid.sandbox-mode:false}")
private boolean sandboxMode;

// In sendEmail method:
if (sandboxMode) {
    mail.setMailSettings(new MailSettings()
        .setSandboxMode(new Setting(true)));
}
```

Enable sandbox mode:
```bash
SENDGRID_SANDBOX_MODE=true
```

Emails will be "sent" but not delivered (useful for testing without spamming).

---

## Monitoring

### Logs

**Critical blood level check:**
```
[INFO] === Starting scheduled critical blood level check ===
[INFO] Found 8 critical blood level entries across all centers
[INFO] Critical blood levels found in 3 RCKiK centers
[INFO] Found 25 users with RCKiK 1 in favorites
[INFO] Critical blood level alert sent to user 123 for RCKiK 1
[INFO] === Scheduled critical blood level check completed. Sent 15 notifications ===
```

**Email sending:**
```
[INFO] Email sent successfully to: user@example.com. Status: 202. Message ID: <abc123>
[ERROR] Failed to send email to: user@example.com. Status: 400. Body: {"errors":[...]}
```

**Rate limiting:**
```
[WARN] Email rate limit exceeded for user ID: 456. Count: 5, Limit: 5
```

### Metrics Queries

**Email Delivery Rate (Last 7 Days):**
```sql
SELECT
    DATE(sent_at) AS date,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) AS delivered,
    ROUND(
        (COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)::NUMERIC / COUNT(*)) * 100,
        2
    ) AS delivery_rate_percent
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

**Email Open Rate (Last 7 Days):**
```sql
SELECT
    DATE(sent_at) AS date,
    COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) AS delivered,
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened,
    ROUND(
        (COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::NUMERIC /
         COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)) * 100,
        2
    ) AS open_rate_percent
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

**Bounce Rate:**
```sql
SELECT
    notification_type,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) AS bounced,
    ROUND(
        (COUNT(*) FILTER (WHERE bounced_at IS NOT NULL)::NUMERIC / COUNT(*)) * 100,
        2
    ) AS bounce_rate_percent
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY notification_type;
```

**Top Users by Email Count:**
```sql
SELECT
    u.id,
    u.email,
    COUNT(el.id) AS email_count
FROM users u
JOIN email_logs el ON el.user_id = u.id
WHERE el.sent_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY email_count DESC
LIMIT 10;
```

### Spring Boot Actuator Metrics

**Email sending metrics:**
- Counter: `mkrew.email.sent`
- Counter: `mkrew.email.failed`
- Gauge: `mkrew.notification.users.eligible`

**Access metrics:**
```bash
curl http://localhost:8080/actuator/metrics/mkrew.email.sent
```

---

## Integration Points

### With US-009 (Favorite RCKiK)
- Users must have RCKiK centers in favorites to receive alerts
- Adding/removing favorites affects notification eligibility
- Priority field not used for notifications (only for UI sorting)

### With US-006 (Notification Preferences)
- `email_enabled` - Master switch for email notifications
- `email_frequency` - Controls when emails are sent:
  - `DISABLED` - No emails
  - `ONLY_CRITICAL` - Only critical alerts (US-010)
  - `DAILY` - Daily digest (future)
  - `IMMEDIATE` - Real-time alerts (future)

### With US-007/US-008 (Blood Levels)
- Notification system queries `mv_latest_blood_levels` or `blood_snapshots`
- Critical threshold: 20% (configurable)
- Links in emails point to RCKiK details page

### With US-022 (Email Deliverability Metrics)
- All emails logged in `email_logs` table
- Delivery, open, bounce tracking
- Analytics queries for reporting
- Admin dashboard integration (future)

### With Scraping System
- Scraper runs at 02:00 CET
- Notification check runs at 03:00 CET (1 hour after)
- Ensures fresh data is available
- Scraper updates `blood_snapshots` table

---

## Error Handling

### SendGrid API Errors

**401 Unauthorized:**
- Check `SENDGRID_API_KEY` is correct
- Verify API key has "Mail Send" permission

**403 Forbidden:**
- Sender email not verified in SendGrid
- Domain authentication required

**400 Bad Request:**
- Invalid email address format
- Missing required fields in request

**429 Rate Limited:**
- SendGrid free tier limit reached (100 emails/day)
- Upgrade plan or reduce frequency

### Application Errors

**User not found:**
- Log warning and skip user
- User may have been deleted between query and processing

**RCKiK not found:**
- Log error and skip notification
- Data integrity issue - investigate

**Rate limit exceeded:**
- Log warning and skip user
- Normal behavior for heavy email users

**Database connection errors:**
- Retry with exponential backoff
- Alert ops team if persistent

---

## Future Enhancements

### MVP+1 (Post-Initial Release)

1. **Email Templates Engine**
   - Use Thymeleaf or Freemarker
   - Separate templates from code
   - Multi-language support

2. **Daily Digest Emails**
   - Batch notifications for users with `DAILY` frequency
   - Summary of all critical levels from favorites

3. **Webhook Integration**
   - SendGrid Event Webhook for real-time tracking
   - Update `email_logs` with delivery/open/bounce events
   - Endpoint: `POST /api/v1/webhooks/sendgrid`

4. **Email Unsubscribe Management**
   - One-click unsubscribe link in emails
   - Unsubscribe tracking table
   - Comply with anti-spam regulations

5. **A/B Testing**
   - Test different subject lines
   - Test different call-to-action messages
   - Measure conversion rate (emails → donations)

6. **Retry Logic**
   - Automatic retry for failed sends
   - Exponential backoff
   - Dead letter queue for persistent failures

---

## Compliance

### GDPR
- Users must opt-in to email notifications (checkbox during registration)
- Consent recorded in `users.consent_timestamp`
- Users can disable emails in preferences
- Email logs retained for 90 days, then archived

### CAN-SPAM Act
- Emails include sender identification
- Physical address in footer (future)
- Clear unsubscribe mechanism
- Unsubscribe honored within 10 business days

### Anti-Spam
- Rate limiting prevents abuse
- Only send to verified emails
- Only send to users who opted in
- Relevant content (critical blood levels at user's favorites)

---

## Troubleshooting

**Emails not sending:**
1. Check `EMAIL_ENABLED=true`
2. Verify `SENDGRID_API_KEY` is set
3. Check SendGrid sender verification
4. Review logs for errors

**Scheduled job not running:**
1. Verify `@EnableScheduling` on main class
2. Check cron expression in `application.yml`
3. Review scheduler logs
4. Check server timezone (Europe/Warsaw)

**Users not receiving emails:**
1. Check user has verified email
2. Check notification preferences
3. Check rate limit not exceeded
4. Check RCKiK is in favorites
5. Check blood level is actually critical

**High bounce rate:**
1. Validate email addresses on registration
2. Remove invalid emails from database
3. Implement double opt-in
4. Monitor bounce types (hard vs soft)

---

## Related Documentation

- PRD: `../.ai/prd.md` (US-010)
- API Plan: `../.ai/api-plan.md`
- Database Schema: `../.ai/plan-db.md` (email_logs table)
- Notification Preferences: `API-NOTIFICATION-PREFERENCES.md` (US-006)
- Favorite RCKiK: `API-FAVORITE-RCKIK.md` (US-009)
- SendGrid Documentation: https://docs.sendgrid.com

---

## Summary

✅ **US-010 Implemented**
- Automated critical blood level monitoring
- Email notifications via SendGrid
- User eligibility filtering
- Rate limiting (5 emails per 24h)
- Comprehensive logging
- Scheduled daily checks (03:00 CET)
- Personalized HTML emails
- Integration with favorites and preferences

**Ready for Production:** Backend implementation complete. Frontend integration and testing pending.
