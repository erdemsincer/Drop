#!/bin/bash

BASE_URL="http://localhost:5072"

echo "=== Testing Drop Claim System ==="
echo ""

# 1. Create Business
echo "1. Creating Business..."
BUSINESS=$(curl -s -X POST "$BASE_URL/api/businesses" \
  -H "Content-Type: application/json" \
  -d '{"name": "Coffee House - 1790018671395702000"}')

BUSINESS_ID=$(echo $BUSINESS | jq -r '.id')
echo "Business ID: $BUSINESS_ID"
echo ""

# 2. Create Branch
echo "2. Creating Branch..."
BRANCH=$(curl -s -X POST "$BASE_URL/api/businesses/$BUSINESS_ID/branches" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown",
    "latitude": 37.7749,
    "longitude": -122.4194
  }')

BRANCH_ID=$(echo $BRANCH | jq -r '.id')
echo "Branch ID: $BRANCH_ID"
echo ""

# 3. Create Drop (with capacity 2)
echo "3. Creating Drop with capacity 2..."
DROP=$(curl -s -X POST "$BASE_URL/api/branches/$BRANCH_ID/drops" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "50% OFF Coffee",
    "description": "Limited time offer",
    "minimumSpend": 10.00,
    "capacity": 2,
    "durationMinutes": 30,
    "claimDurationMinutes": 15
  }')

DROP_ID=$(echo $DROP | jq -r '.id')
echo "Drop ID: $DROP_ID"
echo "Drop Status: $(echo $DROP | jq -r '.status // empty')"
echo ""

# Generate UUIDs for users
USER_A="550e8400-e29b-41d4-a716-446655440001"
USER_B="550e8400-e29b-41d4-a716-446655440002"
USER_C="550e8400-e29b-41d4-a716-446655440003"

# 4. Claim 1 - User A
echo "4. Claiming Drop (User A)..."
CLAIM1=$(curl -s -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_A\"}")

echo "Claim 1 Response:"
echo $CLAIM1 | jq .
CLAIM_ID_1=$(echo $CLAIM1 | jq -r '.claimId // empty')
REMAINING_1=$(echo $CLAIM1 | jq -r '.remainingCapacity // empty')
echo "Remaining Capacity: $REMAINING_1"
echo ""

# 5. Claim 2 - User B
echo "5. Claiming Drop (User B)..."
CLAIM2=$(curl -s -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_B\"}")

echo "Claim 2 Response:"
echo $CLAIM2 | jq .
REMAINING_2=$(echo $CLAIM2 | jq -r '.remainingCapacity // empty')
echo "Remaining Capacity: $REMAINING_2"
echo ""

# 6. Claim 3 - User C (should fail - sold out)
echo "6. Attempting third claim (User C) - Should FAIL with sold out..."
CLAIM3=$(curl -s -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_C\"}")

echo "Claim 3 Response (Expected: 409 Conflict with 'drop.sold_out'):"
echo $CLAIM3 | jq .
echo ""

# 7. Duplicate claim from User A (should fail)
echo "7. Attempting duplicate claim (User A) - Should FAIL..."
CLAIM_DUP=$(curl -s -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_A\"}")

echo "Duplicate Claim Response (Expected: 409 Conflict with 'claim.already_exists'):"
echo $CLAIM_DUP | jq .
echo ""

echo "=== Test Complete ==="
