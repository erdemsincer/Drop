# Drop Backend - Complete End-to-End Flow ✅

## Architecture Overview

```
Domain (No external dependencies)
    ↓
Application (Abstractions, Use Cases)
    ↓
Infrastructure (Repositories, EF Core, PostgreSQL)
    ↓
API (Controllers)
```

---

## What We Built

### 1. **Unit of Work Pattern** ✅
- Created `IUnitOfWork` abstraction in Application layer
- `DropDbContext` implements `IUnitOfWork`
- All `SaveChangesAsync()` calls now happen in services, not repositories
- Enables transaction management across multiple aggregates

### 2. **Business Entity Flow** ✅
**Endpoint**: `POST /api/businesses`
```json
Request:  { "name": "Drop Coffee" }
Response: { "id": "c6f1e794...", "name": "Drop Coffee" }
```
- Service validates business name doesn't already exist
- Repository adds business to DbContext
- UnitOfWork commits the transaction

### 3. **Branch Entity with Location** ✅
**Endpoint**: `POST /api/businesses/{businessId}/branches`
```json
Request: {
  "name": "Drop Coffee Merkez",
  "latitude": 37.0001,
  "longitude": 35.3213
}
Response: {
  "id": "1a34d044...",
  "businessId": "c6f1e794...",
  "name": "Drop Coffee Merkez",
  "latitude": 37.0001,
  "longitude": 35.3213
}
```
- Service validates Business exists
- Domain validates latitude (-90 to 90) and longitude (-180 to 180)
- Repository adds branch
- UnitOfWork commits

### 4. **Active Drop Creation** ✅
**Endpoint**: `POST /api/branches/{branchId}/drops`
```json
Request: {
  "title": "2 kahve alana cheesecake bizden",
  "description": "Sadece bu Drop süresince geçerlidir.",
  "minimumSpend": 200,
  "capacity": 10,
  "durationMinutes": 30,
  "claimDurationMinutes": 15
}
Response: {
  "id": "4dbb4c14...",
  "branchId": "1a34d044...",
  "title": "2 kahve alana cheesecake bizden",
  "capacity": 10,
  "startsAt": "2026-09-21T19:12:11.926066+00:00",
  "endsAt": "2026-09-21T19:42:11.926066+00:00"
}
```
- Service validates Branch exists
- Domain creates Drop in Draft status
- Service gets current time via `TimeProvider` (testable!)
- Drop is activated immediately (Status = Active)
- StartsAt and EndsAt calculated from Duration
- Repository adds drop
- UnitOfWork commits

### 5. **Database Verification** ✅
```
Database: PostgreSQL
Business:     Drop Coffee
Branch:       Drop Coffee Merkez (37.0001°N, 35.3213°E)
Drop Status:  Active
Capacity:     10/10
Duration:     30 minutes
ExpiresAt:    2026-09-21 19:42:11
```

---

## Clean Architecture Principles Applied

### Domain Layer
- ✅ No EF Core references
- ✅ No Database knowledge
- ✅ Encapsulation: `Status = DropStatus.Active;` impossible
- ✅ Only methods like `drop.Activate(now)` allowed
- ✅ Business rules validated in constructor

### Application Layer
- ✅ No DbContext references
- ✅ Repository abstractions without IQueryable
- ✅ Use-case services orchestrate operations
- ✅ `IUnitOfWork` for transaction management
- ✅ `TimeProvider` for testable time handling

### Infrastructure Layer
- ✅ EF Core confined here
- ✅ PostgreSQL connection hidden behind abstractions
- ✅ Fluent API configurations organized
- ✅ Repositories implement application contracts
- ✅ DI registers all dependencies

### API Layer
- ✅ Controllers minimal: just call services
- ✅ Route guards on domain constraints
- ✅ Proper HTTP status codes (201 Created)
- ✅ No business logic in controllers

---

## Database Schema Created

```sql
businesses
  ├── Id (UUID) - Primary Key
  └── Name (VARCHAR 200)

branches
  ├── Id (UUID) - Primary Key
  ├── BusinessId (UUID) - Foreign Key → businesses
  ├── Name (VARCHAR 200)
  ├── Latitude (FLOAT8)
  └── Longitude (FLOAT8)

drops
  ├── Id (UUID) - Primary Key
  ├── BranchId (UUID) - Foreign Key → branches
  ├── Title (VARCHAR 200)
  ├── Description (VARCHAR 1000)
  ├── MinimumSpend (NUMERIC 18,2)
  ├── Capacity (INT)
  ├── Duration (INTERVAL)
  ├── ClaimDuration (INTERVAL)
  ├── Status (VARCHAR 30) - enum as string
  ├── StartsAt (TIMESTAMP TZ)
  └── EndsAt (TIMESTAMP TZ)
  
  Indexes:
  - IX_drops_BranchId
  - IX_drops_Status_EndsAt (for active drops queries)

claims
  ├── Id (UUID) - Primary Key
  ├── DropId (UUID) - Foreign Key → drops
  ├── UserId (UUID)
  ├── Status (VARCHAR 30) - enum as string
  ├── CreatedAt (TIMESTAMP TZ)
  └── ExpiresAt (TIMESTAMP TZ)
  
  Unique Index: (DropId, UserId) - prevents double claim
  Index: (DropId, Status)
```

---

## Next Steps

### Immediate: `GET /api/drops/nearby`
```http
GET /api/drops/nearby?latitude=37.0005&longitude=35.3200&radiusKm=5
```

Response:
```json
[
  {
    "id": "4dbb4c14...",
    "businessName": "Drop Coffee",
    "branchName": "Drop Coffee Merkez",
    "title": "2 kahve alana cheesecake bizden",
    "distanceMeters": 430,
    "remainingCapacity": 10,
    "endsAt": "2026-09-21T19:42:11Z",
    "minimumSpend": 200
  }
]
```

### Important: PostGIS Integration
- Add PostGIS extension to PostgreSQL
- Add `Point` geometry to Branch entity
- Use `ST_DWithin()` for radius queries
- Add GiST spatial indexes

---

## Testing Strategy (Ready for Unit Tests)

### Domain Tests
- ✅ Can test Drop activation with fake time via `TimeProvider`
- ✅ Can test Drop expiration logic without database
- ✅ Can test Business name validation

### Application Tests
- ✅ Mock repositories to test use-case orchestration
- ✅ Test transaction rollback scenarios with IUnitOfWork

### Integration Tests
- ✅ Full stack with test database
- ✅ Verify cascade delete on Branch → Drop

---

## Performance Considerations

1. **Index on (Status, EndsAt)** - for querying active drops
2. **Unique index on (DropId, UserId)** - prevents race conditions
3. **Foreign key cascade** - efficient data cleanup
4. **TimeProvider** - no database hits for time

---

## Summary

✅ **Clean Architecture Implemented**
- Domain is pure business logic
- Application orchestrates use cases
- Infrastructure handles all technical concerns
- API routes requests to application services

✅ **Testability Achieved**
- TimeProvider for time-dependent logic
- Repository abstractions for mocking
- UnitOfWork for transaction testing

✅ **Real Database Integration**
- PostgreSQL working
- Migrations applied
- Foreign keys and indexes in place
- Data verified end-to-end

**Ready for:** Mobile app consumer endpoints, Claim management, PostGIS spatial queries
