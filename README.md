# Salon Management System

One project. One JAR. No separate frontend deploy.

> **New to this repo?** Read **[ARCHITECTURE.txt](./ARCHITECTURE.txt)** for a full explanation of the folder structure, why `backend/` was removed, dev vs production, and what `.gitignore` excludes.

Spring Boot serves both the React UI and REST API from a single executable JAR.

## What you deploy

| Deploy this | Do NOT deploy separately |
|-------------|--------------------------|
| `target/SalonManagementSystem-0.0.1-SNAPSHOT.jar` | `frontend/` folder |
| | `src/` folder |
| | `node_modules/` |

Copy **one JAR file** to your server and run it. Maven builds the React app and embeds it inside the JAR automatically.

## Quick start

### Prerequisites

- Java 17+
- MySQL

### Database

**Requirements:** MySQL must be **installed and running**. You do **not** need to create the database manually — the app creates it on first start.

Default MySQL connection (override with env vars if needed):

| Setting | Default | Env variable |
|---------|---------|--------------|
| Host | localhost | `DB_HOST` |
| Port | 3306 | `DB_PORT` |
| Database | SalonMangement | `DB_NAME` |
| MySQL user | root | `DB_USERNAME` |
| MySQL password | root | `DB_PASSWORD` |

Example for another machine:

```bash
export DB_USERNAME=myuser
export DB_PASSWORD=mypassword
npm run start:api
```

**App login users** (for the UI) are **not** in `application.properties`. They are auto-created in the database by `DataSeeder.java` on first run:

| Username | Password | Role |
|----------|----------|------|
| admin | admin | Owner |
| manager | manager | Branch Manager |
| reception | reception | Reception |
| pm | pm | Product Manager |
| cashier | cashier | Cashier (select "Chashire" on login) |

See **ARCHITECTURE.txt** section 11 for full database & credentials details.

### Build

From the project root:

```bash
./build.sh
```

Or manually:

```bash
./mvnw clean package -DskipTests
java -jar target/SalonManagementSystem-0.0.1-SNAPSHOT.jar
```

Open: **http://localhost:8081/salon-app/**

## Public customer website

Customers can browse the salon without logging in. The public site uses **Lumière Salon** branding (women's salon).

| Page | URL |
|------|-----|
| Home | `/salon-app/` |
| Services & prices (by category) | `/salon-app/services` |
| About Us | `/salon-app/about` |
| Contact Us | `/salon-app/contact` |
| Privacy Policy | `/salon-app/privacy-policy` |
| Terms of Service | `/salon-app/terms-of-service` |
| Refund Policy | `/salon-app/refund-policy` |
| Cancellation Policy | `/salon-app/cancellation-policy` |
| Staff login | `/salon-app/login` |

**Services page:** Loads prices from `GET /salon-app/api/services`, grouped by category (Hair Care, Skin & Facials, Nails, Bridal & Occasions, Spa & Wellness). On first backend run, `DataSeeder` inserts sample services if the table is empty. Branch managers can add or edit services (with category) under **Branch Services** in the staff dashboard.

**Dev UI:** `http://localhost:3000/salon-app/` — same routes as production.

## Development

From the **project root** (no need to `cd frontend`):

```bash
# Install frontend dependencies
npm install

# Option A — both API + React in one command
npm run dev:all

# Option B — two terminals
# Terminal 1 — API
npm run start:api
# or: ./mvnw spring-boot:run

# Terminal 2 — React dev server
npm run dev
```

Dev UI: **http://localhost:3000/salon-app/** (API calls proxy to port 8081; UI is served by React)

> **Proxy error?** Start the backend first: `npm run start:api` in a separate terminal.

## Default users

| Username  | Password  | Role           |
|-----------|-----------|----------------|
| admin     | admin     | Owner          |
| manager   | manager   | Branch Manager |
| reception | reception | Reception      |
| cashier   | cashier   | Cashier        |
| pm        | pm        | Product Manager |

## Project structure (single directory)

```
SalonSystem/                    ← one project root
├── package.json                ← npm scripts (dev, start:api, build)
├── pom.xml                     ← builds everything
├── mvnw
├── build.sh                    ← build script → one JAR
├── src/main/java/              ← Spring Boot backend
├── src/main/resources/         ← config + static UI (after build)
└── frontend/                   ← React source (compiled into JAR, not deployed alone)
```

## Server deployment example

```bash
# On your machine — build once
./build.sh

# Copy only the JAR to server
scp target/SalonManagementSystem-0.0.1-SNAPSHOT.jar user@your-server:/opt/salon/

# On server — run
java -jar /opt/salon/SalonManagementSystem-0.0.1-SNAPSHOT.jar
```

That is the entire deployment: **one file**.
