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

Set your MySQL login in a `.env` file (gitignored; `npm run start:api` and `npm run start:prod` load it automatically):

```bash
cp .env.example .env   # then edit DB_USERNAME / DB_PASSWORD
```

> **Access denied for user 'root'@'localhost'?** Your MySQL password differs from the default `root`. Set `DB_PASSWORD` in `.env` (leave it empty if your root user has no password, e.g. a fresh Homebrew MySQL install).

**App login users** (for the UI) are **not** in `application.properties`. They are auto-created in the database by `DataSeeder.java` on first run:

| Username | Password | Role |
|----------|----------|------|
| admin | Malroo@123 | Owner |
| manager | Malroo@123 | Branch Manager |
| reception | Malroo@123 | Reception |
| pm | Malroo@123 | Product Manager |
| cashier | Malroo@123 | Cashier |

See **ARCHITECTURE.txt** section 11 for full database & credentials details.

### Demo data (for the whole team)

Demo data is not stored in git. Each person fills their **own local database** by starting the app once with the demo switch. It adds a second branch, staff, 18 customers, products and stock, stock requests, about 100 sales over the last 60 days, 38 appointments, salary history and website messages, all dated relative to today.

**First-time setup for a teammate**

```bash
git fetch && git checkout Anushka && git pull   # the branch that has the full system
cp .env.example .env                              # then set DB_PASSWORD if your MySQL has one
npm install
npm run dev:demo                                  # starts API + website and seeds the demo data once
```

Open **http://localhost:3000/salon-app/** and sign in. Every demo account uses the same password, `Malroo@123`:

| Username | Role |
|----------|------|
| `admin` | Owner |
| `manager` | Branch Manager |
| `reception` | Reception |
| `cashier` | Cashier |
| `pm` | Product Manager |
| `cashier2` | Cashier (demo Kandy branch) |

From then on use the normal `npm run dev:all`. The seeder skips itself if demo customers (`@example.com`) already exist, so running `dev:demo` again is harmless.

**Start over with fresh demo data:** in MySQL run `DROP DATABASE SalonMangement;`, then `npm run dev:demo` again.

Backend only: `npm run start:api:demo`. Windows users: run these in Git Bash (the scripts use `sh`).

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

Customers can browse the salon without logging in. The public site uses **Malroo Salon** branding (women's salon, Govinna Handiya, Ratiyelapaara — owner Dulanjili Madushani).

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

**Contact form:** Submissions are saved via `POST /salon-app/api/contact-messages`. Reception staff can view them at **Reception Dashboard → Website Messages**.

**Database updates:** On every backend start, JPA updates the schema (`ddl-auto=update`) and `DatabaseMigrationRunner` fixes existing data (service categories, branch details, legacy Cashier role). Restart the API after pulling changes. Optional manual SQL: `src/main/resources/db/schema-updates.sql`.

**Salon branding** (name, address, phone, hours): edit `frontend/src/utils/salonInfo.js`.

**Dev UI:** `http://localhost:3000/salon-app/` — same routes as production.

**Branch locations:** The Contact page lists every branch from `GET /salon-app/api/branches` with address, phone and opening hours.

## Salon details

| | |
|---|---|
| Name | Malroo Salon |
| Owner | Dulanjili Madushani |
| Address | Govinna Handiya, Ratiyelapaara, Sri Lanka |
| Phone | +94 77 432 6785 |
| Facebook | [Saloon Malroo](https://www.facebook.com/p/Saloon-Malroo-100075910615922/) |

## Staff features by role

| Role | Features |
|------|----------|
| Owner (Admin) | Staff users, branches, salary payments, inventory, billing history (all branches or one), business reports (sales, staff, customers, stock, salaries), appointment history |
| Branch Manager | Branch services, stock request approval, branch stock, billing, branch business report, appointments |
| Reception | Appointments, customers (search, register, update, delete), website enquiries |
| Cashier | Point of Sale checkout, appointments, transaction history |
| Product Manager | Products, inventory levels, stock requests and history |

### Point of Sale (Cashier)

Cashier → **Point of Sale**: add services and products, pick a customer (or walk-in), take **cash** (with change) or **card** payment, then **Print Receipt**.

- `POST /salon-app/api/transactions/checkout` recalculates the bill from database prices (client totals are never trusted), saves each line's price at time of sale, and deducts product stock from the branch. Any error (e.g. not enough stock) rolls back the whole sale.
- Products appear in the POS only after stock exists for the branch (Product Manager requests → Branch Manager approves).

### Sign-in, security and loyalty

- Every API call except the public website (branches, services, contact form) needs a signed-in staff token. Tokens last 12 hours (`APP_TOKEN_HOURS`); after that the app sends the user back to the login page.
- Managers, Reception and Cashiers only see and change data for their own branch. After 5 wrong passwords an account is locked for 10 minutes.
- Before going live, set `APP_SECRET` to a long random string. Other settings (`APP_CORS_ORIGINS`, `APP_TIMEZONE`, `SALON_RESET_DEFAULT_PASSWORDS`, `SALON_LOYALTY_RS_PER_POINT`) are listed in `.env.example`.
- Changed passwords are kept across restarts. If your database was created before this change and still has old default passwords, start once with `SALON_RESET_DEFAULT_PASSWORDS=true`.
- Loyalty: tick the loyalty box when booking to enrol a customer. Members earn 1 point per Rs. 100 spent at checkout (points cannot be redeemed yet).

### Reports (Owner and Branch Manager)

Reports → pick a timeframe (or your own dates) and, as Owner, one branch or all. Everything is grouped into tabs, each compared with the previous period of the same length:

| Tab | What it answers |
|-----|-----------------|
| Overview | Headline numbers and a plain-language list of findings ("revenue is down 12%", "Rose Nail Polish is out of stock") |
| Sales | Revenue over time, by category, by payment method, and by branch including what is left after each branch's salaries (Owner) |
| Services & products | Service menu analysis (stars, busy but low earning, high earner with few buyers, weak, with a suggested action and earnings per hour), growth against the previous period, how often products are sold with services |
| Staff | Appointments, completion rate, hours booked and booked value per stylist; sales per cashier |
| Customers | New vs returning, typical days between visits, loyalty members compared with other customers, top customers, customers to win back (no visit in 60+ days) |
| Appointments | Completed vs cancelled, busy-time heatmap (day by hour), most booked services |
| Stock | Out-of-stock and low items, how many days the stock lasts at the current sales pace, how much to reorder, products that are not selling |
| Salaries & profit | Salaries paid by month, branch and role, and what is left from sales (Owner only) |

Every tab has its own **Excel** and **PDF** buttons (for example `stock-report-<date>.xlsx`) that download just that tab for the period and branch on screen. **Download report…** at the top exports several tabs together, a sheet per tab in Excel or sections in one PDF. The API is `GET /salon-app/api/reports/business`; Managers can only request their own branch, and salary figures are only returned to the Owner. "Left after salaries" is before rent and other expenses, because salaries are the only cost the system records.

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

> **Backend only:** `npm run start:api` skips the React build (`-Dskip.frontend.build=true`). Use the same flag with `./mvnw` when you don't need the UI embedded, e.g. `./mvnw compile -Dskip.frontend.build=true`.

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
