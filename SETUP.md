# CIPD IMS — Setup Guide

How to set up and run this project on a new system.

---

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |
| PostgreSQL | 14.x+ | `psql --version` |

---

## 1. Database Setup

```bash
# Login as postgres superuser
sudo -u postgres psql

# Inside psql:
CREATE USER ims_user WITH PASSWORD 'ims1234';
CREATE DATABASE ims_db OWNER ims_user;
GRANT ALL PRIVILEGES ON DATABASE ims_db TO ims_user;
\q
```

Verify connection:
```bash
psql -U ims_user -d ims_db -c "SELECT 1;"
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from template below)
cp .env.example .env
# Edit .env with your values if different from defaults

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database (admin user, categories)
node prisma/seed.js

# Seed inventory items (all 105 CIPD items)
node prisma/seedItems.js

# Start the server
node src/index.js
# Or with auto-reload:
npx nodemon src/index.js
```

Backend runs at: **http://localhost:5000**

### Backend Environment Variables (.env)

```env
DATABASE_URL=postgresql://ims_user:ims1234@localhost:5432/ims_db
JWT_SECRET=cipd_ims_secret_2024
PORT=5000

# Google Sheets (Phase 10 — optional until then)
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEET_ID=your_sheet_id_here
```

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 4. Dependencies List

### Frontend (`frontend/package.json`)

| Package | Purpose |
|---------|---------|
| react | UI library |
| react-dom | React DOM renderer |
| react-router-dom | Client-side routing |
| axios | HTTP client for API calls |
| tailwindcss | Utility-first CSS framework |
| @tailwindcss/forms | Form element styling plugin |

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| express | Web server framework |
| cors | Cross-origin resource sharing |
| dotenv | Environment variable loading |
| bcrypt | Password hashing |
| jsonwebtoken | JWT token generation/verification |
| prisma | Database ORM (CLI) |
| @prisma/client | Database ORM (client) |
| cookie-parser | Parse cookies from requests |
| googleapis | Google Sheets API (Phase 10) |
| nodemon (dev) | Auto-restart server on file changes |

---

## 5. Ports Used

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |

---

## 6. Useful Commands

```bash
# Check database tables
psql -U ims_user -d ims_db -c "\dt"

# Check users in DB
psql -U ims_user -d ims_db -c 'SELECT name, email, role FROM "User";'

# Check items in DB
psql -U ims_user -d ims_db -c 'SELECT name, quantity FROM "Item" LIMIT 10;'

# Reset database completely (WARNING: deletes all data)
cd backend && npx prisma migrate reset

# Check API health
curl http://localhost:5000/api/health
```

---

## 7. Default Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cipd.iiitd.ac.in | admin123 |
| Student (test) | test@iiitd.ac.in | test123 |

---

## 8. Troubleshooting

**Port already in use:**
```bash
lsof -i :5000  # Find process on port 5000
kill -9 <PID>  # Kill it
```

**PostgreSQL connection refused:**
```bash
sudo systemctl status postgresql  # Check if running
sudo systemctl start postgresql   # Start if not
```

**Prisma migration issues:**
```bash
cd backend
npx prisma migrate reset  # Reset and re-run all migrations
node prisma/seed.js        # Re-seed
node prisma/seedItems.js   # Re-seed items
```

**CORS errors in browser:**
- Make sure backend is running on port 5000
- Frontend Vite proxy handles `/api` requests automatically in dev mode
