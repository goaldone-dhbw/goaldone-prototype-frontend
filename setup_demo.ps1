# Configuration
$BASE_URL = "http://localhost:8080/api/v1"
$SUPERADMIN_EMAIL = "superadmin@goaldone.de"
$SUPERADMIN_PASS = "YourStrongPassword123!"
$ORG_NAME = "Datev eG"
$ORG_ADMIN_EMAIL = "johannes@goaldone.de"

# PowerShell Output Styling
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Goaldone Demo Setup Script (v3: Recurring Templates & Enhanced Breaks) ===" -ForegroundColor Blue

# 1. Login as Superadmin
Write-Host "Logging in as Superadmin..." -ForegroundColor Yellow
$loginBody = @{
  email = $SUPERADMIN_EMAIL
  password = $SUPERADMIN_PASS
} | ConvertTo-Json

try {
  $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
  $ACCESS_TOKEN = $loginResponse.accessToken
} catch {
  Write-Host "Login failed!" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}

if ([string]::IsNullOrWhiteSpace($ACCESS_TOKEN)) {
  Write-Host "Login failed! (Token is null)" -ForegroundColor Red
  exit 1
}
Write-Host "Login successful." -ForegroundColor Green

# 2. Create Organization
Write-Host "Creating organization '$ORG_NAME'..." -ForegroundColor Yellow
$orgBody = @{
  name = $ORG_NAME
  adminEmail = $ORG_ADMIN_EMAIL
} | ConvertTo-Json

$adminHeaders = @{
  "Authorization" = "Bearer $ACCESS_TOKEN"
  "Content-Type" = "application/json"
}

try {
  $orgResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/organizations" -Method Post -Headers $adminHeaders -Body $orgBody
  $ORG_ID = $orgResponse.id
  if ($ORG_ID) {
    Write-Host "Organization created with ID: $ORG_ID" -ForegroundColor Green
  } else {
    Write-Host "Note: Organization creation response did not contain an ID."
  }
} catch {
  Write-Host "Note: Organization creation failed (maybe already exists?)" -ForegroundColor Gray
}

# 3. Wait for Invitation Link
Write-Host "------------------------------------------------------------" -ForegroundColor Blue
Write-Host "Please check the email (or logs) and paste the invitation link here." -ForegroundColor Yellow
$INV_LINK = Read-Host "Link"

if ($INV_LINK -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
  $TOKEN = $matches[1]
} else {
  Write-Host "Could not extract token from link!" -ForegroundColor Red
  exit 1
}

# 4. Accept Invitation
Write-Host "Setting up user account..." -ForegroundColor Yellow
$acceptBody = @{
  firstName = "Automatisch"
  lastName = "Skript"
  password = "password"
} | ConvertTo-Json

try {
  $acceptResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/invitations/$TOKEN/accept" -Method Post -Body $acceptBody -ContentType "application/json"
  $USER_ACCESS_TOKEN = $acceptResponse.accessToken
} catch {
  Write-Host "Failed to accept invitation!" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}

if ([string]::IsNullOrWhiteSpace($USER_ACCESS_TOKEN)) {
  Write-Host "Failed to accept invitation! Token is null." -ForegroundColor Red
  exit 1
}
Write-Host "User account setup complete." -ForegroundColor Green

# Confirmation Prompt
$CONFIRM = Read-Host "Do you want to create demo data (working hours, breaks, templates, tasks)? (Y/n)"
if ($CONFIRM -match '^[Nn]$') {
    Write-Host "Skipping demo data creation. Setup complete!" -ForegroundColor Green
    exit
}

# Header für alle folgenden User-Requests
$userHeaders = @{
  "Authorization" = "Bearer $USER_ACCESS_TOKEN"
  "Content-Type" = "application/json"
}

# 5. Setup 35h Working Week
Write-Host "Configuring 35h working week (Mo-Do 8h, Fr 3h starting 08:00)..." -ForegroundColor Yellow
$WORKING_HOURS_DATA = @"
{
  "days": [
    {"dayOfWeek": "MONDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "TUESDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "WEDNESDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "THURSDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "FRIDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "11:00"},
    {"dayOfWeek": "SATURDAY", "isWorkDay": false},
    {"dayOfWeek": "SUNDAY", "isWorkDay": false}
  ]
}
"@

Invoke-RestMethod -Uri "$BASE_URL/users/me/working-hours" -Method Put -Headers $userHeaders -Body $WORKING_HOURS_DATA | Out-Null

# Helper Functions
function Create-Break ($jsonBody) {
  Invoke-RestMethod -Uri "$BASE_URL/breaks" -Method Post -Headers $userHeaders -Body $jsonBody | Out-Null
}

function Create-RecurringTemplate ($jsonBody) {
  $response = Invoke-RestMethod -Uri "$BASE_URL/recurring-templates" -Method Post -Headers $userHeaders -Body $jsonBody
  return $response.id
}

function Create-Task ($jsonBody) {
  Invoke-RestMethod -Uri "$BASE_URL/tasks" -Method Post -Headers $userHeaders -Body $jsonBody | Out-Null
}

# 6. Create Breaks with different types
Write-Host "Adding breaks: recurring daily breaks and bounded recurring for Monday meetings..." -ForegroundColor Yellow

Write-Host " - Recurring: Daily Lunch Break"
Create-Break @"
{
  "label": "Mittagspause (täglich)",
  "startTime": "12:00",
  "endTime": "13:00",
  "breakType": "RECURRING",
  "recurrence": { "type": "DAILY", "interval": 1 }
}
"@

Write-Host " - Recurring: Daily Morning Coffee"
Create-Break @"
{
  "label": "Kaffeepause (täglich)",
  "startTime": "10:00",
  "endTime": "10:15",
  "breakType": "RECURRING",
  "recurrence": { "type": "DAILY", "interval": 1 }
}
"@

$START_DATE = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$END_DATE = (Get-Date).AddDays(28).ToString("yyyy-MM-dd")
Write-Host " - Bounded Recurring: Monday Team Sync (starting from tomorrow for 4 weeks)"
Create-Break @"
{
  "label": "Wöchentliches Team-Sync (Mo 11:00)",
  "startTime": "11:00",
  "endTime": "12:00",
  "breakType": "BOUNDED_RECURRING",
  "recurrence": { "type": "WEEKLY", "interval": 1 },
  "validFrom": "$START_DATE",
  "validUntil": "$END_DATE"
}
"@

$TOMORROW = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Write-Host " - One-Time: Dentist Appointment Tomorrow"
Create-Break @"
{
  "label": "Zahnarzt-Termin",
  "startTime": "14:00",
  "endTime": "15:00",
  "breakType": "ONE_TIME",
  "date": "$TOMORROW"
}
"@

# 7. Create Recurring Templates
Write-Host "Creating recurring task templates..." -ForegroundColor Yellow

Write-Host " - Recurring Template: Daily Standup (15 min daily at 09:00)"
$STANDUP_ID = Create-RecurringTemplate @"
{
  "title": "Tägliches Standup",
  "cognitiveLoad": "LOW",
  "durationMinutes": 15,
  "preferredStartTime": "09:00",
  "recurrenceRule": { "type": "DAILY", "interval": 1 }
}
"@
Write-Host "   -> ID: $STANDUP_ID" -ForegroundColor Gray

Write-Host " - Recurring Template: Weekly Team Sync (90 min weekly on Monday)"
$SYNC_ID = Create-RecurringTemplate @"
{
  "title": "Wöchentliches Team-Sync",
  "cognitiveLoad": "MEDIUM",
  "durationMinutes": 90,
  "preferredStartTime": "14:00",
  "recurrenceRule": { "type": "WEEKLY", "interval": 1 }
}
"@
Write-Host "   -> ID: $SYNC_ID" -ForegroundColor Gray

Write-Host " - Recurring Template: Monthly Reporting (120 min monthly)"
$REPORT_ID = Create-RecurringTemplate @"
{
  "title": "Monatsabschluss-Analyse",
  "cognitiveLoad": "HIGH",
  "durationMinutes": 120,
  "recurrenceRule": { "type": "MONTHLY", "interval": 1 }
}
"@
Write-Host "   -> ID: $REPORT_ID" -ForegroundColor Gray

# 8. Create Demo Tasks (One-time tasks)
Write-Host "Creating demo one-time tasks..." -ForegroundColor Yellow

$Plus3Days = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
Write-Host " - Demo: High Cognitive Load Task (Architektur-Entwurf, 180 min)"
Create-Task @"
{
  "title": "Architektur-Entwurf (Konzentrationsphase)",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 180,
  "deadline": "$Plus3Days"
}
"@

$Plus7Days = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
Write-Host " - Demo: Long Task (720 min = 12h, should be split by algorithm)"
Create-Task @"
{
  "title": "Jahresbericht schreiben",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 720,
  "deadline": "$Plus7Days"
}
"@

$Plus5Days = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
$Plus2Days = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
Write-Host " - Demo: Medium Task with Start Date (200 min, starts after Wed)"
Create-Task @"
{
  "title": "Anforderungsanalyse fertigstellen",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 200,
  "deadline": "$Plus5Days",
  "startDate": "$Plus2Days"
}
"@

Write-Host " - Demo: Quick Task (LOW priority, no deadline)"
Create-Task @"
{
  "title": "E-Mail-Antworten",
  "cognitiveLoad": "LOW",
  "estimatedDurationMinutes": 60
}
"@

$Plus1Day = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Write-Host " - Demo: Another High Load Task (Code Review, 120 min, deadline tomorrow)"
Create-Task @"
{
  "title": "Code Review durchführen",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 120,
  "deadline": "$Plus1Day"
}
"@

Write-Host "------------------------------------------------------------" -ForegroundColor Blue
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Weekly Budget: " -NoNewline; Write-Host "35h" -ForegroundColor Blue
Write-Host "Highlights:"
Write-Host "  • 3 Recurring Templates (Daily Standup, Weekly Sync, Monthly Report)"
Write-Host "  • 4 Different Break Types (Recurring, Bounded, One-Time)"
Write-Host "  • 5 One-Time Tasks with varying cognitive load and deadlines"
Write-Host "  • High-Load Morning Tasks, Task Splitting, Task Start-Date Constraints"
Write-Host "  • Friday Early-Off (11:00)"
