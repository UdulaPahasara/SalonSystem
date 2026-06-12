# Salon Management System

One project. One JAR. No separate frontend deploy.

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

```sql
CREATE DATABASE SalonMangement;
```

Update `src/main/resources/application.properties` if your MySQL credentials differ (default: `root` / `root`).

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

## Development

```bash
# Terminal 1 — API
./mvnw spring-boot:run

# Terminal 2 — React dev server (optional, for UI work)
cd frontend && npm install && npm start
```

Dev UI: **http://localhost:3000/salon-app/** (proxies API to port 8081)

## Default users

| Username  | Password  | Role           |
|-----------|-----------|----------------|
| admin     | admin     | Owner          |
| manager   | manager   | Branch Manager |
| reception | reception | Reception      |
| cashier   | cashier   | Cashier        |

## Project structure (single directory)

```
SalonSystem/                    ← one project root
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
