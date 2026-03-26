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

echo -e "${BLUE}=== Goaldone Demo Setup Script (v2: 35h Week & Breaks) ===${NC}"

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

# 6. Create Breaks (Monday and Friday)
echo -e "${YELLOW}Adding breaks for Monday and Friday...${NC}"

create_break() {
    curl -s -X POST "$BASE_URL/breaks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d "$1" > /dev/null
}

# Monday Lunch (Daily recurrence but we could also model it specifically)
create_break '{
  "label": "Mittagspause (Mo)",
  "startTime": "12:00",
  "endTime": "12:45"
}'

create_break '{
  "label": "Kaffeepause (Fr)",
  "startTime": "09:30",
  "endTime": "09:45"
}'

# 7. Create Demo Tasks
echo -e "${YELLOW}Creating demo tasks (including 3 recurring ones)...${NC}"

create_task() {
    curl -s -X POST "$BASE_URL/tasks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d "$1" > /dev/null
}

# Recurring Tasks
echo " - Recurring 1: Daily Standup"
create_task '{
  "title": "Tägliches Standup",
  "cognitiveLoad": "LOW",
  "estimatedDurationMinutes": 15,
  "recurrence": { "type": "DAILY", "interval": 1 }
}'

echo " - Recurring 2: Weekly Team Sync"
create_task '{
  "title": "Weekly Team Sync",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 90,
  "recurrence": { "type": "WEEKLY", "interval": 1 }
}'

echo " - Recurring 3: Monthly Reporting"
create_task '{
  "title": "Monatsabschluss-Analyse",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 120,
  "recurrence": { "type": "MONTHLY", "interval": 1 }
}'

# Algorithm Strengths/Edge Cases
echo " - Demo: High Load Morning Task"
create_task '{
  "title": "Architektur-Entwurf (Konzentrationsphase)",
  "cognitiveLoad": "HIGH",
  "estimatedDurationMinutes": 180,
  "deadline": "'$(date -v+3d +%Y-%m-%d)'"
}'

echo " - Demo: Splitting Task (12h)"
create_task '{
  "title": "Jahresbericht schreiben",
  "cognitiveLoad": "MEDIUM",
  "estimatedDurationMinutes": 720,
  "deadline": "'$(date -v+7d +%Y-%m-%d)'"
}'

echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "Weekly Budget: ${BLUE}35h${NC}"
echo -e "Highlights: High-Load Mornings, 12h Splitting, 3 Recurring Tasks, Friday Early-Off (11:00)"
