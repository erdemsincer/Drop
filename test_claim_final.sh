#!/bin/bash

BASE_URL="http://localhost:5072"
TIMESTAMP=$(date +%s%N)

echo "=== Testing Drop Claim System (Timestamp: $TIMESTAMP) ==="
echo ""

# Generate UUIDs for users
USER_A="550e8400-e29b-41d4-a716-446655440001"
USER_B="550e8400-e29b-41d4-a716-446655440002"
USER_C="550e8400-e29b-41d4-a716-446655440003"

# 1. Create Business
echo "1. Creating Business..."
BUSINESS=$(curl -s -X POST "$BASE_URL/api/businesses" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Coffee House $TIMESTAMP\"}")

BUSINESS_ID=$(echo $BUSINESS | jq -r '.id')
echo "Business ID: $BUSINESS_ID"
echo ""

if [ "$BUSINESS_ID" == "null" ] || [ -z "$BUSINESS_ID" ]; then
  echo "ERROR: Failed to create business"
  echo $BUSINESS | jq .
  exit 1
fi

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

if [ "$BRANCH_ID" == "null" ] || [ -z "$BRANCH_ID" ]; then
  echo "ERROR: Failed to create branch"
  echo $BRANCH | jq .
  exit 1
fi

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
echo ""

if [ "$DROP_ID" == "null" ] || [ -z "$DROP_ID" ]; then
  echo "ERROR: Failed to create drop"
  echo $DROP | jq .
  exit 1
fi

# 4. Claim 1 - User A
echo "4. Claiming Drop (User A)..."
CLAIM1=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_A\"}")

HTTP_CODE=$(echo "$CLAIM1" | tail -n1)
CLAIM1_BODY=$(echo "$CLAIM1" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo $CLAIM1_BODY | jq .
REMAINING_1=$(echo $CLAIM1_BODY | jq -r '.remainingCapacity // empty')
echo "Remaining Capacity: $REMAINING_1"
echo ""

# 5. Claim 2 - User B
echo "5. Claiming Drop (User B)..."
CLAIM2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_B\"}")

HTTP_CODE=$(echo "$CLAIM2" | tail -n1)
CLAIM2_BODY=$(echo "$CLAIM2" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo $CLAIM2_BODY | jq .
REMAINING_2=$(echo $CLAIM2_BODY | jq -r '.remainingCapacity // empty')
echo "Remaining Capacity: $REMAINING_2"
echo ""

# 6. Claim 3 - User C (should fail - sold out)
echo "6. Attempting third claim (User C) - Should FAIL with sold out..."
CLAIM3=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_C\"}")

HTTP_CODE=$(echo "$CLAIM3" | tail -n1)
CLAIM3_BODY=$(echo "$CLAIM3" | head -n-1)

echo "HTTP Status: $HTTP_CODE (Expected: 409)"
echo "Response (Expected error code 'drop.sold_out'):"
echo $CLAIM3_BODY | jq .
echo ""

# 7. Duplicate claim from User A (should fail)
echo "7. Attempting duplicate claim (User A) - Should FAIL..."
CLAIM_DUP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/drops/$DROP_ID/claims" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_A\"}")

HTTP_CODE=$(echo "$CLAIM_DUP" | tail -n1)
CLAIM_DUP_BODY=$(echo "$CLAIM_DUP" | head -n-1)

echo "HTTP Status: $HTTP_CODE (Expected: 409)"
echo "Response (Expected error code 'claim.already_exists'):"
echo $CLAIM_DUP_BODY | jq .
echo ""

echo "=== Test Complete ==="
