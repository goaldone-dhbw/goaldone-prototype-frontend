#!/bin/bash

# Configuration
BASE_URL="http://localhost:8080/api/v1"
SUPERADMIN_EMAIL="superadmin@goaldone.de"
SUPERADMIN_PASS="YourStrongPassword123!"
ORG_NAME="Datev eG"
ORG_ADMIN_EMAIL="johannes@goaldone.de"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Goaldone Demo Setup Script (v3: Recurring Templates & Enhanced Breaks) ===${NC}"

# 1. Login as Superadmin
echo -e "${YELLOW}Logging in as Superadmin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SUPERADMIN_EMAIL\", \"password\": \"$SUPERADMIN_PASS\"}")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" == "null" ]; then
    echo "Login failed!"
    echo $LOGIN_RESPONSE
    exit 1
fi
echo -e "${GREEN}Login successful.${NC}"

# 2. Create Organization
echo -e "${YELLOW}Creating organization '$ORG_NAME'...${NC}"
ORG_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/organizations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"name\": \"$ORG_NAME\", \"adminEmail\": \"$ORG_ADMIN_EMAIL\"}")

ORG_ID=$(echo $ORG_RESPONSE | jq -r '.id')
if [ "$ORG_ID" == "null" ]; then
    echo "Note: Organization creation response was null (maybe already exists?)"
else
    echo -e "${GREEN}Organization created with ID: $ORG_ID${NC}"
fi

# 3. Wait for Invitation Link
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${YELLOW}Please check the email (or logs) and paste the invitation link here.${NC}"
read -p "Link: " INV_LINK

TOKEN=$(echo $INV_LINK | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')

if [ -z "$TOKEN" ]; then
    echo "Could not extract token from link!"
    exit 1
fi

# 4. Accept Invitation
echo -e "${YELLOW}Setting up user account...${NC}"
ACCEPT_RESPONSE=$(curl -s -i -X POST "$BASE_URL/auth/invitations/$TOKEN/accept" \
  -H "Content-Type: application/json" \
  -d "{\"firstName\": \"Automatisch\", \"lastName\": \"Skript\", \"password\": \"password\"}")

USER_ACCESS_TOKEN=$(echo "$ACCEPT_RESPONSE" | grep -oE '\{.*\}' | jq -r '.accessToken')

if [ "$USER_ACCESS_TOKEN" == "null" ] || [ -z "$USER_ACCESS_TOKEN" ]; then
    echo "Failed to accept invitation!"
    exit 1
fi
echo -e "${GREEN}User account setup complete.${NC}"

# 5. Setup 35h Working Week
# Mo-Do: 8h (08:00 - 16:00), Fr: 3h (08:00 - 11:00)
echo -e "${YELLOW}Configuring 35h working week (Mo-Do 8h, Fr 3h starting 08:00)...${NC}"
WORKING_HOURS_DATA='{
  "days": [
    {"dayOfWeek": "MONDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "TUESDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "WEDNESDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "THURSDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "16:00"},
    {"dayOfWeek": "FRIDAY", "isWorkDay": true, "startTime": "08:00", "endTime": "11:00"},
    {"dayOfWeek": "SATURDAY", "isWorkDay": false},
    {"dayOfWeek": "SUNDAY", "isWorkDay": false}
  ]
}'

curl -s -X PUT "$BASE_URL/users/me/working-hours" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -d "$WORKING_HOURS_DATA" > /dev/null

# 6. Create Breaks with different types
echo -e "${YELLOW}Adding breaks: recurring daily breaks and bounded recurring for Monday meetings...${NC}"

create_break() {
    curl -s -X POST "$BASE_URL/breaks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d "$1" > /dev/null
}

# Recurring daily lunch break (every day forever)
echo " - Recurring: Daily Lunch Break"
create_break '{
  "label": "Mittagspause (täglich)",
  "startTime": "12:00",
  "endTime": "13:00",
  "breakType": "RECURRING",
  "recurrence": { "type": "DAILY", "interval": 1 }
}'

# Recurring daily morning coffee break (every day forever)
echo " - Recurring: Daily Morning Coffee"
create_break '{
  "label": "Kaffeepause (täglich)",
  "startTime": "10:00",
  "endTime": "10:15",
  "breakType": "RECURRING",
  "recurrence": { "type": "DAILY", "interval": 1 }
}'

# Bounded recurring break only on Mondays for this week
MONDAY=$(date -v+0d +%Y-%m-%d)
FRIDAY=$(date -v+4d +%Y-%m-%d)
echo " - Bounded Recurring: Monday Team Sync (Mo-Fr of current week)"
create_break '{
  "label": "Wöchentliches Team-Sync (Mo 11:00)",
  "startTime": "11:00",
  "endTime": "12:00",
  "breakType": "BOUNDED_RECURRING",
  "recurrence": { "type": "WEEKLY", "interval": 1 },
  "validFrom": "'$MONDAY'",
  "validUntil": "'$FRIDAY'"
}'

# One-time break for today (e.g., dentist appointment)
echo " - One-Time: Dentist Appointment Today"
TODAY=$(date +%Y-%m-%d)
create_break '{
  "label": "Zahnarzt-Termin",
  "startTime": "14:00",
  "endTime": "15:00",
  "breakType": "ONE_TIME",
  "date": "'$TODAY'"
}'

# 7. Create Recurring Templates
echo -e "${YELLOW}Creating recurring task templates...${NC}"

create_recurring_template() {
    RESPONSE=$(curl -s -X POST "$BASE_URL/recurring-templates" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d "$1")
    TEMPLATE_ID=$(echo $RESPONSE | jq -r '.id // empty')
    echo $TEMPLATE_ID
}

# Daily Standup
echo " - Recurring Template: Daily Standup (15 min daily at 09:00)"
STANDUP_ID=$(create_recurring_template '{
  "title": "Tägliches Standup",
  "cognitiveLoad": "LOW",
  "durationMinutes": 15,
  "preferredStartTime": "09:00",
  "recurrenceRule": { "type": "DAILY", "interval": 1 }
}')

# Weekly Team Sync
echo " - Recurring Template: Weekly Team Sync (90 min weekly on Monday)"
SYNC_ID=$(create_recurring_template '{
  "title": "Wöchentliches Team-Sync",
  "cognitiveLoad": "MEDIUM",
  "durationMinutes": 90,
  "preferredStartTime": "14:00",
  "recurrenceRule": { "type": "WEEKLY", "interval": 1 }
}')

# Monthly Reporting
echo " - Recurring Template: Monthly Reporting (120 min monthly)"
REPORT_ID=$(create_recurring_template '{
  "title": "Monatsabschluss-Analyse",
  "cognitiveLoad": "HIGH",
  "durationMinutes": 120,
  "recurrenceRule": { "type": "MONTHLY", "interval": 1 }
}')

# 8. Create Demo Tasks (One-time tasks)
echo -e "${YELLOW}Creating demo one-time tasks...${NC}"

create_task() {
    curl -s -X POST "$BASE_URL/tasks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d "$1" > /dev/null
}

# Demo: High Load Morning Task
echo " - Demo: High Cognitive Load Task (Architektur-Entwurf, 180 min)"
create_task '{
  "title": "Architektur-Entwurf (Konzentrationsphase)",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 180,
  "deadline": "'$(date -v+3d +%Y-%m-%d)'"
}'

# Demo: Long Task that should be split
echo " - Demo: Long Task (720 min = 12h, should be split by algorithm)"
create_task '{
  "title": "Jahresbericht schreiben",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 720,
  "deadline": "'$(date -v+7d +%Y-%m-%d)'"
}'

# Demo: Medium task with start date constraint
echo " - Demo: Medium Task with Start Date (200 min, starts after Wed)"
create_task '{
  "title": "Anforderungsanalyse fertigstellen",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 200,
  "deadline": "'$(date -v+5d +%Y-%m-%d)'",
  "startDate": "'$(date -v+2d +%Y-%m-%d)'"
}'

# Demo: Quick task without deadline (Low priority)
echo " - Demo: Quick Task (LOW priority, no deadline)"
create_task '{
  "title": "E-Mail-Antworten",
  "cognitiveLoad": "LOW",
  "estimatedDurationMinutes": 60
}'

# Demo: Another HIGH cognitive task
echo " - Demo: Another High Load Task (Code Review, 120 min, deadline tomorrow)"
create_task '{
  "title": "Code Review durchführen",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 120,
  "deadline": "'$(date -v+1d +%Y-%m-%d)'"
}'

echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "Weekly Budget: ${BLUE}35h${NC}"
echo -e "Highlights:"
echo -e "  • 3 Recurring Templates (Daily Standup, Weekly Sync, Monthly Report)"
echo -e "  • 4 Different Break Types (Recurring, Bounded, One-Time)"
echo -e "  • 5 One-Time Tasks with varying cognitive load and deadlines"
echo -e "  • High-Load Morning Tasks, Task Splitting, Task Start-Date Constraints"
echo -e "  • Friday Early-Off (11:00)"
