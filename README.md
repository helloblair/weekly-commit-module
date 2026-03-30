# Weekly Commit Module

A micro-frontend module that replaces 15-Five with RCDO-linked weekly planning. Team members create weekly commitments aligned to organizational Rally Cries, Defining Objectives, and Outcomes, then reconcile actual results at week's end.

## Architecture

- **Backend**: Java 21, Spring Boot 3.2, Spring Data JPA, PostgreSQL, Flyway
- **Frontend**: React 18, TypeScript (strict), Webpack 5 + Module Federation
- **Auth**: JWT Bearer token (Base64 payload with `sub` and `role` claims)

## Prerequisites

- Java 21+
- Node.js 20+
- PostgreSQL 16+
- Docker (optional, for containerized setup)

## Quick Start (Local Development)

### 1. Database

```bash
# Create the dev database
psql -U postgres -c "CREATE DATABASE weekly_commit"
```

### 2. Backend

```bash
# Run with Flyway migrations (seeds dev data automatically)
mvn spring-boot:run
# Backend runs on http://localhost:8081
```

### 3. Frontend

```bash
npm install
npm run dev
# Frontend runs on http://localhost:3001 (proxies /api to :8081)
```

## Quick Start (Docker Compose)

```bash
docker compose up --build
# Frontend: http://localhost:3001
# Backend:  http://localhost:8081
# Postgres: localhost:5433
```

## Running Tests

### Backend (Java)

```bash
# Requires PostgreSQL running with weekly_commit_test database
psql -U postgres -c "CREATE DATABASE weekly_commit_test"
mvn test
```

Test suite: 83 Java tests (state machine unit, service integration, controller MockMvc)

### Frontend (Jest)

```bash
npm test              # single run
npm run test:watch    # watch mode
```

Test suite: 28 component/unit tests

### E2e (Playwright)

```bash
# Requires backend + frontend running
npm run test:e2e
```

## CI Pipeline

GitHub Actions runs on push/PR to `main`:
1. **Backend Tests** — Postgres service container + `mvn test`
2. **Frontend Tests** — `type-check` + `lint` + `jest --ci`
3. **E2e Tests** — Playwright smoke tests against running app

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/plans?userId=&weekOf=` | Get or create weekly plan |
| POST | `/api/v1/plans/{id}/lock` | Lock plan (DRAFT -> LOCKED) |
| POST | `/api/v1/plans/{id}/start-reconciliation` | Start reconciliation (LOCKED -> RECONCILING) |
| POST | `/api/v1/plans/{id}/complete-reconciliation` | Complete reconciliation with carry-forward |
| GET | `/api/v1/plans/{planId}/commits` | List commits for a plan |
| POST | `/api/v1/plans/{planId}/commits` | Create commit (201) |
| PUT | `/api/v1/commits/{id}` | Update commit |
| DELETE | `/api/v1/commits/{id}` | Soft-delete commit (204) |
| GET | `/api/v1/rcdo/hierarchy?orgId=` | RCDO hierarchy tree |
| GET | `/api/v1/manager/team-rollup?managerId=&weekOf=` | Team roll-up |
| GET | `/api/v1/manager/rcdo-coverage?managerId=&orgId=&weekOf=` | RCDO coverage |

Full OpenAPI spec available at `/swagger-ui.html` when running.

## Plan Lifecycle State Machine

```
DRAFT -> LOCKED -> RECONCILING -> RECONCILED
                                      |
                                      v
                              Carry-forward to
                              next week (DRAFT)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/weekly_commit` | JDBC URL |
| `DATABASE_USERNAME` | `postgres` | DB user |
| `DATABASE_PASSWORD` | `postgres` | DB password |
| `SERVER_PORT` | `8081` | Backend port |
| `MANAGER_AUTH_ENABLED` | `false` | Require JWT for manager endpoints |
| `SPRING_PROFILES_ACTIVE` | (none) | Set to `prod` for production |
